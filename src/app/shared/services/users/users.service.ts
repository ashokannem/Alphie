import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from '../auth/auth.service';
import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor( private afs: AngularFirestore, private auth: AuthService ) {}

  GetAll() {
    return new Promise((resolve, reject) => {
      this.afs.collection('users').ref.get().then((dataSnapshot) => {
        if(!dataSnapshot.empty) {
          resolve(dataSnapshot.docs);
        } else {
          reject('no-users');
        }
      });
    });
  }

  async GetNotiPrefs() {
    const { uid } = await this.auth.GetUser();
    return this.afs.collection('users').doc(uid).collection('preferences').doc('notifications').valueChanges();
  }

  async UpdateNotiPrefs(newPrefs:any) {
    const { uid } = await this.auth.GetUser();
    return this.afs.collection('users').doc(uid).collection('preferences').doc('notifications').set(newPrefs, { merge: true });
  }

}
