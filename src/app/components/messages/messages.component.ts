import { Component, OnInit, OnDestroy, HostListener, AfterViewChecked, AfterViewInit, ElementRef, ViewChild, TemplateRef, NgZone } from '@angular/core';
import { ActivatedRoute, Router, Event, NavigationStart } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Observable, empty, of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { AuthService } from '../../shared/services/auth/auth.service';
import { MessagesService } from '../../shared/services/messages/messages.service';
import { UsersService } from '../../shared/services/users/users.service';
import { VoiceRecognitionService } from '../../shared/services/voice-recognition/voice-recognition.service'

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit, OnDestroy, AfterViewInit {

  modalRef?: BsModalRef;
  public newMessageForm: FormGroup = new FormGroup({
    'type' : new FormControl('team', [Validators.required]),
    'title' : new FormControl('', [Validators.required]),
    'members' : new FormControl([], [Validators.required]),
    'message' : new FormControl('', [Validators.required])
  });

  @ViewChild('newModalTemplate', { static: true }) newMessageModalTemplate!: TemplateRef<unknown>;
  @ViewChild('newMsgInput') private newMsgInput!: ElementRef;
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  @HostListener('window:resize', ['$event'])
  onResize(event:any) {
    if(event.target.innerWidth <= 599 && !this.selectedChatId) {
      this.leftBarCollapse = true;
    } else {
      this.leftBarCollapse = false;
    }
  }

  public leftBarCollapse: boolean = true;

  public selectedChatId!: string;
  public selectedChat: Observable<any> = of(null);
  public selectedChatLastReadMessageIndex!: number;

  public newMsg: string = '';

  public currentUserUID!:string;
  public userChats: any = [];
  public allUsers: any = [];

  public teamConversations: any = [];
  public userConversations: any = [];

  private userDataSubscriptionManager!: any;

  private componentDestroyed = new Subject<any>();

  public pickEmojis: boolean = false;
  public listening: boolean = false;

  constructor( private ngZone: NgZone, public ms: MessagesService, private route: ActivatedRoute, private router: Router, public voiceService : VoiceRecognitionService, public auth: AuthService, private usersService: UsersService, private modalService: BsModalService ) {
    this.voiceService.init()
  }

  ngOnInit(): void {
    this.auth.GetUser().then((user) => {
      this.currentUserUID = user.uid;
    }).finally(() => {
      this.usersService.GetAll().then((usersSnapshot:any) => {
        usersSnapshot.forEach((childSnapshot:any) => {
          let userData = childSnapshot.data();
          if(userData.uid !== this.currentUserUID) {
            this.allUsers.push(userData);
          }
        });
      });
      this.route.params.subscribe((params:any) => {
        if(params.id) {
          this.selectChat(params.id);
        }
      });
      this.route.queryParams.subscribe((queryParams:any) => {
        if(queryParams) {
          if(queryParams.action === 'create') {
            this.openModal(this.newMessageModalTemplate);
          } 
        }
      });
    });
  }

  ngAfterViewInit(): void {

    this.ms.getUserChats().then((dataSnapshot) => {
      dataSnapshot.subscribe((userChats) => {
        if(userChats.length > 0) {
          userChats.forEach((chatSnapshot) => {
            let chat = chatSnapshot.payload.doc.data();
            this.userChats.push(chat);
            this.teamConversations = [];
            this.userConversations = [];
            chat.reference.onSnapshot((observer:any) => {
              let message = observer.data();
              message['id'] = observer.id;
              if(observer.data().teamChat) {
                let conversationReferenceIndex = this.teamConversations.findIndex((c:any) => c.id === chat.id);
                if(conversationReferenceIndex > -1) {
                  let lastMessage = observer.data().messages[observer.data().messages.length-1];
                  lastMessage['index'] = observer.data().messages.length-1;
                  this.teamConversations[conversationReferenceIndex] = { userLastRead: chat.lastRead, receiver: observer.data().receiver, icon: `https://icotar.com/avatar/${observer.data().title}`, title: observer.data().title, id: chat.id, lastMessage: lastMessage }
                } else {
                  let lastMessage = observer.data().messages[observer.data().messages.length-1];
                  lastMessage['index'] = observer.data().messages.length-1;
                  this.teamConversations.push({ userLastRead: chat.lastRead, icon: `https://icotar.com/avatar/${observer.data().title}`, title: observer.data().title, id: chat.id, lastMessage: lastMessage });
                }
              } else {
                let conversationReferenceIndex = this.userConversations.findIndex((c:any) => c.id === chat.id);
                if(conversationReferenceIndex > -1) {
                  let lastMessage = observer.data().messages[observer.data().messages.length-1];
                  lastMessage['index'] = observer.data().messages.length-1;
                  this.userConversations[conversationReferenceIndex] = { 
                    userLastRead: chat.lastRead,
                    uid: observer.data().uid, 
                    receiver: observer.data().receiver, 
                    title: observer.data().title, 
                    id: chat.id, 
                    lastMessage: lastMessage 
                  }
                } else {
                  let lastMessage = observer.data().messages[observer.data().messages.length-1];
                  lastMessage['index'] = observer.data().messages.length-1;
                  this.userConversations.push({ 
                    userLastRead: chat.lastRead,
                    uid: observer.data().uid, 
                    receiver: observer.data().receiver, 
                    title: observer.data().title, 
                    id: chat.id, 
                    lastMessage: lastMessage 
                  });
                }
              }
            })
          })
        } else {
          this.teamConversations = [];
          this.userConversations = [];
        }
      });
    });

  }

  ngAfterViewChecked() {
    this.scrollToBottom();
    this.newMessageForm.controls['type'].valueChanges.subscribe((observer) => {
      if(observer.value === 'team') {
        this.ngZone.run(() => {
          this.newMessageForm.controls['title'].setValidators([Validators.required]);
          this.newMessageForm.controls['title'].updateValueAndValidity();
        });
      } else {
        this.ngZone.run(() => {
          this.newMessageForm.controls['title'].setValidators(null);
          this.newMessageForm.controls['title'].updateValueAndValidity();
        });
      }
    });
  }

  ngOnDestroy() {
    this.componentDestroyed.next();
    this.ms.setUserActiveMessage().then(() => {

    });
  }

  createChat() {
    if(typeof this.newMessageForm.controls['members'].value === 'string') {
      this.newMessageForm.controls['members'].setValue([this.newMessageForm.controls['members'].value]);
    }
    this.ms.create({
      teamChat: this.newMessageForm.controls['type'].value === 'team' ? true : false,
      members: this.newMessageForm.controls['members'].value,
      title: this.newMessageForm.controls['title'].value,
      message: this.newMessageForm.controls['message'].value
    }).then((chatId) => {
      this.modalService.hide();
      this.router.navigateByUrl(`messages?id=${chatId}`);
    })
  }

  selectChat(chatId:string) {
    this.componentDestroyed.next();
    this.selectedChatId = chatId;
    const source:any = this.ms.get(chatId);
    this.selectedChat = this.ms.joinUsers(source);
    this.selectedChat.pipe(takeUntil(this.componentDestroyed)).subscribe((observer) => {
      if(observer) {
        let lastMessageIndex = observer.messages.length-1;
        this.ms.updateUserLastRead(observer.id, lastMessageIndex);
        this.selectedChatLastReadMessageIndex = lastMessageIndex;
      }
    });
    this.ms.setUserActiveMessage(chatId).then(() => {

    });
    if(this.leftBarCollapse) {
      this.leftBarCollapse = false;
    }
  }

  submit(chatId:string) {
    this.ms.sendMessage(chatId, this.newMsg);
    this.newMsg = '';
  }

  trackByCreated(i:any, msg:any) {
    return msg.createdAt;
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }                 
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  startVoice() {
    this.listening = true;
    this.voiceService.start();
    this.voiceService.tempWords.subscribe((text:any) => {
      this.newMsg = text;
    });
  }

  stopVoice() {
    this.listening = false;
    this.voiceService.stop();
  }

  addEmoji(event:any) {
    this.newMsg = this.newMsg + '  ' + event.emoji.native + '  ';
    this.pickEmojis = false;
    this.newMsgInput.nativeElement.focus();
  }

}
