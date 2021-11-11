import { Injectable } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { BehaviorSubject } from 'rxjs';
import { mergeMapTo } from 'rxjs/operators';
 
@Injectable({
  providedIn: 'root'
})

export class NotificationsService {

  currentMessage = new BehaviorSubject(null);

  constructor( private angularFireMessaging: AngularFireMessaging ) {
    this.angularFireMessaging.messages.subscribe((_messaging:any) => {
      _messaging.onMessage = _messaging.onMessage.bind(_messaging);
      _messaging.onTokenRefresh = _messaging.onTokenRefresh.bind(_messaging);
    });
  }

  requestPermission() {
    this.angularFireMessaging.requestPermission.pipe(mergeMapTo(this.angularFireMessaging.tokenChanges)).subscribe((token) => {
      console.log('Permission granted! Save to the server!', token);
    }, (error:any) => {
      console.error(error);
    });
  }

  receiveMessage() {
    this.angularFireMessaging.messages.subscribe((payload:any) => {
      console.log("new message received. ", payload);
      this.currentMessage.next(payload);
    })
  }

}