import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { Observable, combineLatest, of } from 'rxjs';

import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {

  constructor( private afs: AngularFirestore, private auth: AuthService, private router: Router ) {}

  get(messageId:string) {
    return this.afs.collection<any>('messages').doc(messageId).snapshotChanges().pipe(map(doc => {
      return { id: doc.payload.id, ...doc.payload.data() };
    }))
  }

  async create(messageInfo:any) {
    const { uid } = await this.auth.GetUser();

    const data = {
      uid,
      createdAt: Date.now(),
      count: 0,
      teamChat: messageInfo.teamChat,
      receiver: messageInfo.teamChat ? null : messageInfo.members[0],
      title: messageInfo.title ? messageInfo.title : null,
      messages: [],
      members: [uid]
    };

    const docRef = await this.afs.collection('messages').add(data);

    await messageInfo.members.forEach( async(member:any) => {

      await this.addUserToChat(docRef.id, member);

      await this.afs.collection('messages').doc(docRef.id).set({
        'members' : firebase.firestore.FieldValue.arrayUnion(member)
      }, { merge: true });

    });

    await this.addUserToChat(docRef.id, uid, true);

    await this.sendMessage(docRef.id, messageInfo.message);

    return docRef.id;
  }

  async updateChatTitle(chatId:string, title:string) {

    const docRef = await this.afs.collection('messages').doc(chatId).set({
      'title' : title
    }, { merge: true });

  }

  async getUserChats() {

    const { uid } = await this.auth.GetUser();

    return this.afs.collection('users').doc(uid).collection('chats').snapshotChanges();

  }

  async addUserToChat(chatId:string, userId:string, creator?: boolean) {

    let reference = firebase.firestore().doc(`messages/${chatId}`);

    let data = {
      'id' : chatId,
      'lastRead' : -1,
      'reference' : reference
    }

    if(creator) {
      data['lastRead'] = 0;
    }

    const docRef = await this.afs.collection('users').doc(userId).collection('chats').doc(chatId).set(data, { merge: true });

  }

  async removeUserFromChat(chatId:string, userId:string) {

    let reference = firebase.firestore().doc(`messages/${chatId}`);

    const docRef = await this.afs.collection('users').doc(userId).collection('chats').doc(chatId).delete();

  }

  async sendMessage(chatId:string, content:string) {
    const { uid } = await this.auth.GetUser();

    const data = {
      uid,
      content,
      createdAt: Date.now()
    };

    if(uid) {

      // Update the message
      const ref = this.afs.collection('messages').doc(chatId);
      return ref.update({
        count: firebase.firestore.FieldValue.increment(1),
        messages: firebase.firestore.FieldValue.arrayUnion(data)
      });
    }
  }

  async updateUserLastRead(chatId:string, messageId:number) {
    const { uid } = await this.auth.GetUser();
    if(uid) {
      return this.afs.collection('users').doc(uid).collection('chats').doc(chatId).set({
        'lastRead' : (messageId+1)
      }, { merge: true });
    }
  }

  async setUserActiveMessage(chatId?:string) {
    const { uid } = await this.auth.GetUser();

    if(uid) {
      if(chatId) {
        return this.afs.collection('users').doc(uid).set({
          'userActiveChat' : chatId
        }, { merge: true });
      } else {
        return this.afs.collection('users').doc(uid).set({
          'userActiveChat' : null
        }, { merge: true });
      }
    }
  }

  joinUsers(chat$: Observable<any>) {
    let chat:any;
    const joinKeys:any = {};

    let returnValue = chat$.pipe(
      switchMap(c => {
        chat = c;
        const uids = Array.from(new Set(c.messages.map((v:any) => v.uid)));

        const userDocs = uids.map(u =>
          this.afs.doc(`users/${u}`).valueChanges()
        );

        return userDocs.length ? combineLatest(userDocs) : of([]);
      }),
      map(arr => {
        arr.forEach(v => (joinKeys[(<any>v).uid] = v));
        chat.messages = chat.messages.map((v:any) => {
          return { ...v, user: joinKeys[v.uid] };
        });

        return chat;
      })
    );
    return returnValue;
  }

}
