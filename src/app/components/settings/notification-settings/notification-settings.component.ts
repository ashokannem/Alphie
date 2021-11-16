import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { mergeMapTo, mergeMap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { UsersService } from '../../../shared/services/users/users.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';

@Component({
  selector: 'app-notification-settings',
  templateUrl: './notification-settings.component.html',
  styleUrls: ['./notification-settings.component.css']
})
export class NotificationSettingsComponent implements OnInit {

  public methods: any = [];
  public actions: any = [];

  public saving: boolean = false;
  public notificationsAllowed: boolean = false;
  private token!: string;
  public notificationForm: FormGroup = new FormGroup({
    'push-newTicketCreated' : new FormControl(false),
    'push-newTicketMessage' : new FormControl(false),
    'push-ticketDepartmentChanged' : new FormControl(false),
    'push-ticketPriorityChanged' : new FormControl(false),
    'push-ticketUserAdded' : new FormControl(false),
    'push-ticketUserRemoved' : new FormControl(false),
    'email-newTicketCreated' : new FormControl(false),
    'email-newTicketMessage' : new FormControl(false),
    'email-ticketDepartmentChanged' : new FormControl(false),
    'email-ticketPriorityChanged' : new FormControl(false),
    'email-ticketUserAdded' : new FormControl(false),
    'email-ticketUserRemoved' : new FormControl(false),
  });

  constructor( private afMessaging: AngularFireMessaging, private afStore: AngularFirestore, private authService: AuthService, private toast: ToastrService, public userService: UsersService ) { }

  ngOnInit(): void {
    this.afMessaging.tokenChanges.subscribe( async(token) => {
      if(token) {
        let { uid } = await this.authService.GetUser();
        this.afStore.collection('webTokenToUsers').doc(token).ref.get().then((snapshot:any) => {
          if(snapshot.exists) {
            if(snapshot.data().uid === uid) {
              this.token = token;
              this.notificationsAllowed = true;
            } else {
              this.token = '';
              this.notificationsAllowed = false; 
            }
          } else {
            this.token = '';
            this.notificationsAllowed = false; 
          }
        })
      } else {
        this.token = '';
        this.notificationsAllowed = false;
      }
    });
    this.userService.GetNotiPrefs().then((notiPrefs) => {
      notiPrefs.subscribe((observer:any) => {
        Object.keys(observer).forEach((key:string) => {
          Object.keys(observer[key]).forEach((pref:string) => {
            if(this.notificationForm.controls[`${key}-${pref}`]) {
              this.notificationForm.controls[`${key}-${pref}`].setValue(observer[key][pref]);
              this.notificationForm.updateValueAndValidity();
            } else {
              this.notificationForm.registerControl(`${key}-${pref}`, new FormControl(''));
              this.notificationForm.controls[`${key}-${pref}`].setValue(observer[key][pref]);
              this.notificationForm.updateValueAndValidity();
            }
          })
        })
      })
    })
  }

  async requestPermission() {
    let { uid } = await this.authService.GetUser();
    this.afMessaging.requestPermission.pipe(mergeMapTo(this.afMessaging.tokenChanges)).subscribe((token:any) => {
      this.afStore.collection('webTokenToUsers').doc(token).set({
        'token' : token,
        'uid' : uid
      }, { merge: true });
      this.token = token;
      this.notificationsAllowed = true;
    }, (error) => {
      this.toast.warning(error.message);
    });
  }

  async removePermission() {
    this.afStore.collection('webTokenToUsers').ref.where('token', '==', this.token).get().then((snapshot) => {
      if(!snapshot.empty) {
        snapshot.docs[0].ref.delete().then(() => {
          this.afMessaging.getToken.pipe(mergeMap((token:any) => this.afMessaging.deleteToken(token))).subscribe((token) => {
            this.token = '';
            this.notificationsAllowed = false;
            this.toast.success('Push notifications removed', 'Success');
          });
        }).catch((error:any) => {
          this.toast.warning(error.message);
        });
      }
    }).catch((error:any) => {
      this.toast.warning(error.message);
    });
  }

  saveChanges() {
    this.saving = true;
    if(this.notificationForm.valid && this.notificationForm.touched) {
      this.notificationForm.disable();
      let data: any = {
        'email' : {},
        'push' : {}
      };
      Object.keys(this.notificationForm.controls).forEach((controlKey:string) => {
        let method = controlKey.split('-')[0];
        let pref = controlKey.split('-')[1];
        data[method][pref] = this.notificationForm.controls[controlKey].value;
      });
      this.userService.UpdateNotiPrefs(data).then(() => {
        this.toast.success('Settings updated', 'Success');
        this.saving = false;
        this.notificationForm.markAsUntouched();
        this.notificationForm.enable();
      }).catch((error:any) => {
        this.toast.error(error.message, 'Error');
        this.saving = false;
        this.notificationForm.enable();
      });
    } else {
      if(!this.notificationForm.valid) {
        this.saving = false;
        this.toast.error('You have missing fields.', 'Error');
        this.notificationForm.enable();
      } else {
        this.saving = false;
        this.toast.error('No changed detected.', 'Error');
        this.notificationForm.enable();
      }
    }
  }

}
