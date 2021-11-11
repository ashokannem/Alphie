import { Pipe, PipeTransform } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Pipe({
  name: 'user'
})
export class UserPipe implements PipeTransform {

  constructor( private afs: AngularFirestore ) { }

  async transform(userId: string, requestedValue: string) {
    if(userId.includes('@')) {
      if(requestedValue === 'photoURL') {
        let email = userId.split('<')[1].replace('>', '');
        return `https://icotar.com/avatar/${email}`;
      } else if(requestedValue === 'displayName') {
        let displayName = userId.split('<')[0];
        return displayName.trim();
      } else if(requestedValue === 'email') {
        let email = userId.split('<')[1].replace('>', '');
        return email;
      }
    } else {
      return this.afs.collection('users').doc(userId).get().toPromise().then((userData:any) => {
        if(requestedValue === 'photoURL') {
          if(userData.data()[requestedValue] == null) {
            let email = userData.data().email;
            return `https://icotar.com/avatar/${email}`;
          } else {
            return userData.data()[requestedValue];
          }
        } else if(requestedValue === 'displayName') {
          if(userData.data()[requestedValue] == null) {
            return userData.data()['email'].split('@')[0];
          } else {
            return userData.data()[requestedValue];
          }
        } else {
          return userData.data()[requestedValue];
        }
      });
    }
  }

}
