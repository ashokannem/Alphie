import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor( private afs: AngularFirestore ) {}

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

}
