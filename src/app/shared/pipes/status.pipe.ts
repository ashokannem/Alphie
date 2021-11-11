import { Pipe, PipeTransform } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Pipe({
  name: 'status'
})
export class StatusPipe implements PipeTransform {

  constructor( private afs: AngularFirestore ) { }

  transform(uid: string) {
    return this.afs.collection('users').doc(uid).get().toPromise().then((userData:any) => {
      let status = userData.data()['status'];
      let result = status === 'online' ? 'bg-success' : 'bg-danger';
      return result;
    });
  }

}
