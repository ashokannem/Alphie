import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AuthService } from '../auth/auth.service';
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})

export class NotificationsService {

  private _userNotifications = new BehaviorSubject<any>([]);
  public userNotifications = this._userNotifications.asObservable();

  constructor( private afs: AngularFirestore, private authService: AuthService, private afAuth: AngularFireAuth ) {
    this.afAuth.authState.subscribe((user) => {
      if(user) {
        this.afs.collection('users').doc(user.uid).collection('notifications').snapshotChanges().subscribe((observer) => {
          this._userNotifications.next(observer);
        });
      }
    });
  }

  async AddNotification(from:string, data:any) {
    let { uid } = await this.authService.GetUser();
    let now = Date.now();
    data['from'] = from;
    data['delivered'] = new Date(now);
    data['read'] = false;
    this.afs.collection('users').doc(uid).collection('notifications').add(data).then(() => {

    }).catch((error) => {

    });
  }

  async markAsRead(notificationID:string) {
    let { uid } = await this.authService.GetUser();
    this.afs.collection('users').doc(uid).collection('notifications').doc(notificationID).set({
      'read' : true
    }, { merge: true }).then(() => {

    }).catch((error) => {

    });
  }

}