import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { Observable, combineLatest, of } from 'rxjs';

import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root'
})
export class TicketsService {

  constructor( private afs: AngularFirestore, private auth: AuthService, private aff: AngularFireFunctions, private router: Router ) {}

  getBranding() {
    return this.afs.collection<any>('settings').doc('branding').valueChanges().pipe(map(data => {
      return data;
    }));
  }

  getSettings() {
    return this.afs.collection<any>('settings').doc('tickets').valueChanges().pipe(map(data => {
      return data;
    }));
  }

  saveSettings(settings:any) {
    return this.afs.collection<any>('settings').doc('tickets').set(settings, { merge: true });
  }

  getDepartments() {
    return this.afs.collection<any>('settings').doc('tickets').collection('departments').valueChanges().pipe(map(data => {
      return data;
    }));
  }

  getNextNumber():Promise<number> {
    return new Promise((resolve, reject) => {
      this.afs.collection<any>('tickets').ref.get().then((collectionSnapshot) => {
        if(!collectionSnapshot.empty) {
          let lastTicketNumber = collectionSnapshot.docs[collectionSnapshot.docs.length-1].data().number;
          resolve((lastTicketNumber+1));
        } else {
          this.afs.collection<any>('settings').doc('tickets').ref.get().then((settingsSnapshot) => {
            if(settingsSnapshot.exists) {
              resolve(settingsSnapshot.data().startingTicketNumber);
            } else {
              resolve(1);
            }
          });
        }
      });
    });
  }

  getAll() {
    return this.afs.collection<any>('tickets').snapshotChanges().pipe(map(ticketsSnapshot => {
      let tickets:any = [];
      ticketsSnapshot.forEach((ticketSnapshot:any) => {
        tickets.push({ id: ticketSnapshot.payload.doc.id, ...ticketSnapshot.payload.doc.data() });
      })
      return tickets;
    }));
  }

  getOne(ticketId:string) {
    return this.afs.collection<any>('tickets').doc(ticketId).snapshotChanges().pipe(map(doc => {
      return { id: doc.payload.id, ...doc.payload.data() };
    }));
  }

  async createOne(data:any, method?:string) {
    this.getNextNumber().then( async(ticketNumber:number) => {
      const user = await this.auth.GetUser();
      const now = Date.now();
      const responseDueAt = new Date(now + 24*60*60*1000);
      const result = await this.afs.collection<any>('tickets').add({
        'created_by' : user ? user.uid : data.customerEmail,
        'number' : ticketNumber,
        'created' : new Date(now),
        'customer' : `${data.customerName} <${data.customerEmail}>`,
        'department' : data.department,
        'method' : method ? method : 'manual',
        'preview' : data.body.substring(0, 40),
        'priority' : data.priority,
        'response_due' : method ? responseDueAt : null,
        'spf' : 'pass',
        'subject' : data.subject
      });
      this.afs.collection('tickets').doc(result.id).ref.get().then((documentSnapshot) => {
        let ticket:any = documentSnapshot.data();
        ticket['id'] = documentSnapshot.id;
        if(method) {
          if(method === 'public') {
            this.afs.collection<any>('tickets').doc(ticket.id).set({
              'messages' : firebase.firestore.FieldValue.arrayUnion({
                'created' : new Date(now),
                'from' : 'Alphie Support <help@alphie.et-kc.com>',
                'html' : data.body,
                'response_due' : responseDueAt
              })
            }, { merge: true });
            this.addMessage(ticket, `We have received ticket #${ticketNumber} concerning ${data.subject} and will provide a response within 24 hours, typically sooner. If you have additional details to add, feel free to reply to this email. Thank you and have a great day!`, method);
          } else {
            this.addMessage(ticket, data.body);
          }
        } else {
          this.addMessage(ticket, data.body);
        }
      });
    });
  }

  updatePriority(ticketID: string, priority:number) {
    return this.afs.collection<any>('tickets').doc(ticketID).set({
      'priority' : priority
    }, { merge: true });
  }

  updateDepartment(ticketID: string, department:string, previous:string) {
    return this.afs.collection<any>('tickets').doc(ticketID).set({
      'department' : department,
      'previousDepartment' : previous
    }, { merge: true });
  }

  closeTicket(ticket: any) {
    this.addMessage(ticket, 'This message has now been closed. Please create a new ticket if you need further assistance.');
    return this.updateDepartment(ticket.id, 'closed', ticket.department);
  }

  addMessage(ticket: any, message:string, method?:string) {
    let data = {
      to: ticket.customer,
      from: 'Alphie Support <help@alphie.et-kc.com>',
      subject: `Re: ${ticket.subject}`,
      text: message.replace(/(<([^>]+)>)/gi, ""),
      html: message
    }
    const callable = this.aff.httpsCallable('outgoingEmail');
    let results = callable(data);
    results.subscribe( async() => {
      const user = await this.auth.GetUser();
      const now = Date.now();
      const from = user ? user.displayName : 'Alphie Support';
      const responseDueAt = new Date(now + 24*60*60*1000);
      return this.afs.collection<any>('tickets').doc(ticket.id).set({
        'response_due' : method ? responseDueAt : null,
        'messages' : firebase.firestore.FieldValue.arrayUnion({
          'created' : new Date(now),
          'from' : `${from} <help@alphie.et-kc.com>`,
          'html' : message,
          'response_due' : responseDueAt
        })
      }, { merge: true }).then( async() => {
        if(user) {
          let uid = user.uid;
          if(ticket.users) {
            let isUserAssigned = ticket.users.find((u:any) => u === uid) ? true : false;
            if(!isUserAssigned) {
              this.afs.collection<any>('tickets').doc(ticket.id).set({
                'users' : firebase.firestore.FieldValue.arrayUnion(uid)
              }, { merge: true });
            }
          } else {
            this.afs.collection<any>('tickets').doc(ticket.id).set({
              'users' : firebase.firestore.FieldValue.arrayUnion(uid)
            }, { merge: true });
          }
        }
        if(ticket.department === 'closed') {
          this.updateDepartment(ticket.id, ticket.previousDepartment, 'closed');
        }
      })
    });
  }

}
