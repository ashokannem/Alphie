import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { Observable, combineLatest, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import firebase from 'firebase/compat/app';

import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class TicketsService {

  constructor( private afs: AngularFirestore, private auth: AuthService, private aff: AngularFireFunctions, private router: Router ) {}

  getMonthlyTicketsByDepartment(month:number, department:string) {
    return new Promise((resolve, reject) => {
      let count = 0;
      let ticketCount = 0;
      this.afs.collection('tickets').ref.get().then((ticketsSnapshot) => {
        if(ticketsSnapshot.empty) {
          resolve(ticketCount);
        } else {
          ticketsSnapshot.forEach((ticketSnapshot) => {
            count++;
            let ticket:any = ticketSnapshot.data();
            let ticketDepartment = ticket.previousDepartment;
            let ticketCreatedMonth = moment(ticket.created.seconds*1000).get('month');
            if(ticketCreatedMonth === month && ticketDepartment === department) {
              ticketCount++;
            }
            if(count === (ticketsSnapshot.size-1)) {
              resolve(ticketCount);
            }
          })
        }
      });
    });
  }

  getUserTicketCount() {
    return new Promise( async(resolve, reject) => {
      let count = 0;
      let assignedTicketCount = 0;
      let { uid } = await this.auth.GetUser();
      this.afs.collection('tickets').ref.where('users', '!=', null).get().then((ticketsSnapshot) => {
        if(ticketsSnapshot.empty) {
          resolve(assignedTicketCount);
        } else {
          ticketsSnapshot.forEach((ticketSnapshot) => {
            count++;
            let ticket:any = ticketSnapshot.data();
            let users = ticket.users;
            if(users.length > 0) {
              if(users.findIndex((user:any) => user === uid) > -1 && ticket.department !== 'closed') {
                assignedTicketCount = (assignedTicketCount + 1);
              }
            }
            if(count === (ticketsSnapshot.size-1)) {
              resolve(assignedTicketCount);
            }
          })
        }
      })
    });
  }

  getThisMonthsTicketCount() {
    return new Promise( async(resolve, reject) => {
      let count = 0;
      let createdTicketCount = 0;
      this.afs.collection('tickets').ref.get().then((ticketsSnapshot) => {
        if(ticketsSnapshot.empty) {
          resolve(createdTicketCount);
        } else {
          ticketsSnapshot.forEach((ticketSnapshot) => {
            count++;
            let ticket:any = ticketSnapshot.data();
            let today:Date = new Date();
            let created:Date = new Date(ticket.created.seconds*1000);
            moment(created).isSame(today, 'months') ? createdTicketCount++ : null;
            if(count === (ticketsSnapshot.size-1)) {
              resolve(createdTicketCount);
            }
          })
        }
      })
    })
  }

  getUsersAssignedTicketsThisMonth() {
    return new Promise( async(resolve, reject) => {
      let count = 0;
      let createdTicketCount = 0;
      let { uid } = await this.auth.GetUser();
      this.afs.collection('tickets').ref.get().then((ticketsSnapshot) => {
        if(ticketsSnapshot.empty) {
          resolve(createdTicketCount);
        } else {
          ticketsSnapshot.forEach((ticketSnapshot) => {
            count++;
            let ticket:any = ticketSnapshot.data();
            let today:Date = new Date();
            let created:Date = new Date(ticket.created.seconds*1000);
            if(ticket.users.length > 0) {
              if(ticket.users.findIndex((user:any) => user === uid) > -1) {
                moment(created).isSame(today, 'months') ? createdTicketCount++ : null;
              }
            }
            if(count === (ticketsSnapshot.size-1)) {
              resolve(createdTicketCount);
            }
          })
        }
      })
    })
  }

  getBranding() {
    return this.afs.collection<any>('settings').doc('branding').valueChanges().pipe(map(data => {
      return data;
    }));
  }

  saveBranding(settings:any) {
    return this.afs.collection<any>('settings').doc('branding').set(settings, { merge: true });
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
      console.log('Service', data);
      return data;
    }));
  }

  saveDepartments(departments:any) {
    return this.afs.collection<any>('settings').doc('tickets').set({
      'departments' : departments
    }, { merge: true });
  }

  addDepartment(department:any) {
    return this.afs.collection<any>('settings').doc('tickets').set({
      'departments' : firebase.firestore.FieldValue.arrayUnion(department)
    }, { merge: true });
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
        'previousDepartment' : data.department,
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
                'from' : `${environment.appConfig.supportName} <${environment.appConfig.supportEmail}>`,
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
      from: `${environment.appConfig.supportName} <${environment.appConfig.supportEmail}>`,
      subject: `Re: ${ticket.subject}`,
      text: message.replace(/(<([^>]+)>)/gi, ""),
      html: message
    }
    const callable = this.aff.httpsCallable('outgoingEmail');
    let results = callable(data);
    results.subscribe( async() => {
      const user = await this.auth.GetUser();
      const now = Date.now();
      const from = user ? user.displayName : '${environment.appConfig.supportName}';
      const responseDueAt = new Date(now + 24*60*60*1000);
      return this.afs.collection<any>('tickets').doc(ticket.id).set({
        'response_due' : method ? responseDueAt : null,
        'messages' : firebase.firestore.FieldValue.arrayUnion({
          'created' : new Date(now),
          'from' : `${from} <${environment.appConfig.supportEmail}>`,
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
