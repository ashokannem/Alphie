import { Component, OnInit, AfterViewInit, Inject, Renderer2, HostListener, TemplateRef } from '@angular/core';
import { DOCUMENT } from  '@angular/common';
import { Event,NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { AuthService } from './shared/services/auth/auth.service';
import { MessagesService } from './shared/services/messages/messages.service';
import { SetupService } from './shared/services/setup/setup.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../environments/environment';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { BsDropdownConfig } from 'ngx-bootstrap/dropdown';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [{ provide: BsDropdownConfig, useValue: { isAnimated: true, autoClose: true } }]
})
export class AppComponent implements OnInit, AfterViewInit {

  @HostListener('window:resize', ['$event'])
  onResize(event:any) {
    if(event.target.innerWidth <= 599) {
      this.isSidebarCollapsed = true;
    } else {
      this.isSidebarCollapsed = false;
    }
  }

  public modalRef?: BsModalRef;
  public modalConfig: any = {
    animated: true
  };
  public isSidebarCollapsed = false;
  public isSidebarToggled = false;
  public loading: boolean = false;
  public title: string = environment.appConfig.title;
  public logoIcon: string = environment.appConfig.logoIcon;
  public page!: string;
  public userDirectMessages: any = [];
  public unreadMessageCount: number = 0;
  public currentUserUID!: string;

  constructor( @Inject(DOCUMENT) private document: Document, private toast: ToastrService, private afMessaging: AngularFireMessaging, private renderer: Renderer2, private router: Router, private setupService: SetupService, public authService:AuthService, public messageService: MessagesService, private modalService: BsModalService ) {
    this.router.events.subscribe((event: Event) => {
      switch(true) {
        case event instanceof NavigationStart: {
          this.loading = true;
          break;
        }
        case event instanceof NavigationEnd: {
          this.page = this.titleCase(this.router.url.split('/')[1]);
          this.document.title = `${this.title} - ${this.page}`;
          setTimeout(() => {
            this.loading = false;
          }, 950);
          break;
        }
        case event instanceof NavigationCancel:
        case event instanceof NavigationError: {
          setTimeout(() => {
            this.loading = false;
          }, 950);
          break;
        }
        default: {
          break;
        }
      }
    });
  }

  ngOnInit():void {
  }

  ngAfterViewInit(): void {

    this.afMessaging.messages.subscribe((message) => {
      this.toast.info(message.notification?.body, message.notification?.title);
    });

    this.setupService.CheckSetup().then(() => {

    }).catch((error:any) => {
      this.toast.error(error.message, 'Whoops');
    })

    if(window.innerWidth <= 599) {
      this.isSidebarCollapsed = true;
    } else {
      this.isSidebarCollapsed = false;
    }
    this.authService.allUserData.subscribe((userData:any) => {
      if(userData) {

        this.unreadMessageCount = userData.unreadMessageCount;

        this.currentUserUID = userData.uid;
        this.messageService.getUserChats().then((dataSnapshot:any) => {
          dataSnapshot.subscribe((userChats:any) => {
            if(userChats.length > 0) {

              userChats.forEach((chatSnapshot:any) => {

                let chat = chatSnapshot.payload.doc.data();

                chat.reference.onSnapshot((observer:any) => {

                  let message = observer.data();
                  message['id'] = observer.id;
                  message['lastMessage'] = observer.data().messages[observer.data().messages.length-1];
                  message['lastMessage'].index = (observer.data().messages.length-1);
                  message['userLastRead'] = chat.lastRead;
                  if(message.teamChat) {
                    message['icon'] = `https://icotar.com/avatar/${observer.data().title}`;
                  }
                  let conversationReferenceIndex = this.userDirectMessages.findIndex((c:any) => c.id === chat.id);
                  if(conversationReferenceIndex > -1) {
                    this.userDirectMessages[conversationReferenceIndex] = message;
                  } else {
                    this.userDirectMessages.push(message);
                  }

                });

              });
            }
          });
        });

      }
    })
  }

  toggleSidebar() {
    this.isSidebarToggled = !this.isSidebarToggled;
    if(this.isSidebarToggled) {
      this.renderer.addClass(document.body, 'sidebar-toggled');
    } else {
      this.renderer.removeClass(document.body, 'sidebar-toggled');
    }
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template, this.modalConfig);
  }

  private titleCase(str:string) {
    return str.toLowerCase().split(' ').map(function(word) {
      return word.replace(word[0], word[0].toUpperCase());
    }).join(' ');
  }

}
