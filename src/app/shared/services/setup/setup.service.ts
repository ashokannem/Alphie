import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class SetupService {

  constructor( private afs: AngularFirestore ) { }

  CheckSetup() {
    return new Promise( async(resolve, reject) => {
      const ref = this.afs.collection('settings');
      const snapshot = await ref.get();
      snapshot.subscribe((settingsSnapshot) => {
        if(settingsSnapshot.empty) {
          ref.doc('branding').set({
            'companyName' : 'Doe Enterprises',
            'logo' : '',
            'primaryColor' : '#4e73df',
            'secondaryColor' : '#ffffff'
          }, { merge: true });
          ref.doc('tickets').set({
            'departments' : [
              {
                'key' : 'undetermined',
                'value' : 'Undetermined'
              },
              {
                'key' : 'general',
                'value' : 'General'
              },
              {
                'key' : 'closed',
                'value' : 'Closed'
              }
            ],
            'headerText' : 'Thank you for choosing Alphie Ticketing',
            'publicTicketPage' : false,
            'returnUrl' : 'https://www.example.com',
            'startingTicketNumber' : '1',
            'ticketPageClosedText' : 'We apologize, we are not currently accepting tickets. Please contact us directly.'
          }, { merge: true });
        } else {
          resolve(settingsSnapshot.docs);
        }
      });
    });
  }

}
