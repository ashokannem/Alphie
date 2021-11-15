const Busboy = require('busboy');

const sgMail = require('@sendgrid/mail');

import * as functions from "firebase-functions";

const admin = require('firebase-admin');

admin.initializeApp();

sgMail.setApiKey(functions.config().sendgrid.key);

export const incomingEmail = functions.https.onRequest( async(req, res) => {

  if(req.method !== 'POST') {
    return res.status(405).end();
  }

  const busboy = new Busboy({headers: req.headers});

  const fields:any = {};

  busboy.on('field', (fieldName:any, val:any) => {
    fields[fieldName] = val;
  });

  busboy.on('finish', async () => {
    let htmlParts = fields.html.replace(/(<([^>]+)>)/gi, " ");
    let preview = htmlParts.substring(0, 40);
    const now = Date.now();
    const responseDueAt = new Date(now + 24*60*60*1000);

    let subject = fields.subject.replace('Re: ', '');

    const ticketsRef = admin.firestore().collection('tickets');
    const ticketsSnapshot = await ticketsRef.where('customer', '==', fields.from).where('subject', '==', subject).limit(1).get();

    if(ticketsSnapshot.empty) {

      const results = await admin.firestore().collection('tickets').add({
        'created' : new Date(now),
        'department' : 'unassigned',
        'method' : 'email',
        'preview' : preview,
        'priority' : 0,
        'response_due' : responseDueAt,
        'subject' : fields.subject,
        'customer' : fields.from,
        'spf' : fields.SPF
      });
      admin.firestore().collection('tickets').doc(results.id).set({
        'messages' : admin.firestore.FieldValue.arrayUnion({
          'html' : fields.html,
          'created' : new Date(now),
          'response_due' : responseDueAt,
          'from' : fields.from
        })
      }, { merge: true });

      res.send();

    } else {

      ticketsSnapshot.forEach((ticket:any) => {

        admin.firestore().collection('tickets').doc(ticket.id).set({
          'response_due' : responseDueAt,
          'messages' : admin.firestore.FieldValue.arrayUnion({
            'html' : fields.html,
            'created' : new Date(now),
            'response_due' : responseDueAt,
            'from' : fields.from
          })
        }, { merge: true });

      });

      res.send();

    }

  });

  busboy.end(req.rawBody);

});

exports.outgoingEmail = functions.https.onCall((data, context) => {

  return (async () => {
    try {
      let message = await sgMail.send(data);
      return message;
    } catch (error) {
      if(error.response) {
        throw new functions.https.HttpsError('unknown', error.response.body);
      }
    }
  })();

});

async function sendEmail(data:any, action:string, ignoringUser?:string) {
  return new Promise( async(resolve, reject) => {
    let ref = admin.firestore().collection('users');
    let snapshot = await ref.get(); 
    let ran = 0;
    snapshot.forEach( async(doc:any) => {
      let user = doc.data();
      let prefRef = admin.firestore().collection('users').doc(doc.id).collection('preferences').doc('notifications');
      let prefDoc = await prefRef.get();
      if(prefDoc.exists) {
        let prefs = prefDoc.data();
        if(prefs.email[action]) {
          data['to'] = user.email;
          await sgMail.send(data);
        }
      }
      ran++;
      if(ran === snapshot.size) {
        resolve('all users notified');
      }
    });
  });
}

export const sendUserInvites = functions.firestore.document('invites/{inviteID}').onCreate((snap:any, context:any) => {
  return new Promise( async(resolve, reject) => {
    const newValue = snap.data();
    if(newValue.email) {
      let message = {
        'to' : newValue.email,
        'from' : `${functions.config().app_config.support_name} <${functions.config().app_config.support_email}>`,
        'subject' : `You've been invited to join your team!`,
        'text' : 'You have been invited to join your team on Alphie!',
        'html' : `<b>Hey ${newValue.displayName},</b><br/><br/>You have been invited to join your team on ${functions.config().app_config.title}, their all in one ticketing platform!<br/><br/><b>Ready to get started?</b> We thought so! Simply <a href="https://${functions.config().app_config.interface_domain}/userInvite/${snap.id}">click here</a> to join your team!<br/><br/>Cheers!`
      }
      await sgMail.send(message);
      resolve('Email invite was sent');
    }
  });
});

export const manageTicketUserNotifications = functions.firestore.document('tickets/{ticketID}').onWrite((change:any, context:any) => {
  // If the document does not exist, it has been deleted.
  const document = change.after.exists ? change.after.data() : null;
  // If the old document does not exist, it was just created.
  const oldDocument = change.before.exists ? change.before.data() : null;
  if(document) {
    // The document was not deleted.
    if(oldDocument) {
      // The document was updated.
      if(document.priority !== oldDocument.priority) {
        // The priority of the ticket was changed.
        let message = {
          'from' : `${functions.config().app_config.support_name} <${functions.config().app_config.support_email}>`,
          'subject' : `Ticket #${document.number} priority was changed`,
          'text' : 'A ticket had the priority updated.',
          'html' : `Ticket #${document.number} had the priority changed from ${oldDocument.priority} to ${document.priority}`,
        }
        return sendEmail(message, 'ticketPriorityChanged');
      } else if(document.department !== oldDocument.department) {
        // The department of the ticket was changed.
        let message = {
          'from' : `${functions.config().app_config.support_name} <${functions.config().app_config.support_email}>`,
          'subject' : `Ticket #${document.number} department was changed`,
          'text' : 'A ticket had the department updated.',
          'html' : `Ticket #${document.number} had the department changed from ${oldDocument.department} to ${document.department}`,
        }
        return sendEmail(message, 'ticketDepartmentChanged');
      } else if(document.users !== oldDocument.users) {
        // The users list of the ticket was updated.
        if(document.users.length > oldDocument.users.length) {
          // Users have been added.
          let message = {
            'from' : `${functions.config().app_config.support_name} <${functions.config().app_config.support_email}>`,
            'subject' : `Ticket #${document.number} had users added`,
            'text' : 'A ticket had users added.',
            'html' : `Ticket #${document.number} had users added, check out your admin panel to view it.`,
          }
          return sendEmail(message, 'ticketUserAdded');
        } else if(document.users.length < oldDocument.users.length) {
          // Users have been removed.
          let message = {
            'from' : `${functions.config().app_config.support_name} <${functions.config().app_config.support_email}>`,
            'subject' : `Ticket #${document.number} had users removed`,
            'text' : 'A ticket had users removed.',
            'html' : `Ticket #${document.number} had users removed, check out your admin panel to view it.`,
          }
          return sendEmail(message, 'ticketUserRemoved');
        } else {
          return 'unhandled-action';
        }  
      } else if(document.messages !== oldDocument.messages) {
        // A message was added to the ticket
        let message = {
          'from' : `${functions.config().app_config.support_name} <${functions.config().app_config.support_email}>`,
          'subject' : `Ticket #${document.number} recieved a new message`,
          'text' : 'A ticket received a new message.',
          'html' : `Ticket #${document.number} had a new message received, check out your admin panel to view it.`,
        }
        return sendEmail(message, 'newTicketMessage');
      } else {
        return 'unhandled-action';
      }
    } else {
      // The document was just created.
      let ticketCreatedBy = document.created_by;
      let message = {
        'from' : `${functions.config().app_config.support_name} <${functions.config().app_config.support_email}>`,
        'subject' : `New ticket #${document.number} was created`,
        'text' : 'A new ticket was created for your company, Check it out!',
        'html' : `A new ticket with the subject of, ${document.subject} was just created. Visit your admin panel to begin working on it.`,
      }
      return sendEmail(message, 'newTicketCreated', ticketCreatedBy);
    }
  } else {
    // The document was deleted.
    return 'no-further-action-required.';
  }
});

export const trackUserChats = functions.firestore.document('users/{userId}/chats/{chatId}').onUpdate( async(change:any, context:any) => {

  const newDocument = change.after.exists ? change.after.data() : null;

  const oldDocument = change.before.data();

  if(newDocument) {

    if(newDocument.lastRead > oldDocument.lastRead) {

      let userChatReference = admin.firestore().collection('users').doc(context.params.userId).collection('chats').doc(context.params.chatId);

      userChatReference.get().then( async(userChatSnapshot:any) => {

        if(userChatSnapshot.exists) {

          let chatCount = userChatSnapshot.data().count;

          let difference = chatCount - newDocument.lastRead;

          await userChatReference.set({
            'unreadMessageCount' : difference
          }, { merge: true });

          let allUserChatReference = admin.firestore().collection('users').doc(context.params.userId).collection('chats');
          let allUserChatSnapshot = await allUserChatReference.get();
          let totalUnreadMessagesCount = 0;
          allUserChatSnapshot.forEach((doc:any) => {
            let chat = doc.data();
            chat['id'] = doc.id;
            if(chat.unreadMessageCount > 0) {
              totalUnreadMessagesCount = totalUnreadMessagesCount + chat.unreadMessageCount;
            }
          });
          admin.firestore().collection('users').doc(context.params.userId).set({
            'unreadMessageCount' : totalUnreadMessagesCount
          }, { merge: true });

        }

      });

    } else if(newDocument.unreadMessageCount !== oldDocument.unreadMessageCount) {

      let allUserChatReference = admin.firestore().collection('users').doc(context.params.userId).collection('chats');
      let allUserChatSnapshot = await allUserChatReference.get();
      let totalUnreadMessagesCount = 0;
      allUserChatSnapshot.forEach((doc:any) => {
        let chat = doc.data();
        chat['id'] = doc.id;
        if(chat.unreadMessageCount > 0) {
          totalUnreadMessagesCount = totalUnreadMessagesCount + chat.unreadMessageCount;
        }
      });
      admin.firestore().collection('users').doc(context.params.userId).set({
        'unreadMessageCount' : totalUnreadMessagesCount
      }, { merge: true });

    }

  }

  return 'done';

});

export const trackMessages = functions.firestore.document('messages/{messageID}').onWrite((change:any, context:any) => {

  const document = change.after.exists ? change.after.data() : null;

  const oldDocument = change.before.data();

  if(document) {

    if(oldDocument) {

      // The conversation was updated.

      if(document.messages.length !== oldDocument.messages.length) {

        // The conversation had a message added to it.

        Object.keys(document.members).forEach((value:string, index:number) => {

          console.log('MEMBER UPDATE: ', document.members[index]);

          let userReference = admin.firestore().collection('users').doc(document.members[index]);

          let userChatReference = admin.firestore().collection('users').doc(document.members[index]).collection('chats').doc(context.params.messageID);

          userChatReference.get().then((userChatSnapshot:any) => {

            if(userChatSnapshot.exists) {

              let userChat = userChatSnapshot.data();
              let lastReadMessage = userChat.lastRead;

              userReference.get().then((userSnapshot:any) => {

                if(userSnapshot.exists) {

                  if(userSnapshot.data().userActiveChat !== context.params.messageID) {

                    userChatReference.set({
                      'unreadMessageCount' : document.count - lastReadMessage
                    }, { merge: true });

                  }

                }

              })

            }

          });

        });

        return 'done';

      } else {

        // Something else changed on the message but not the message count.

        return 'no-action-required';

      }

    } else {

      // The conversation was just created.

      return 'conversation action pending';

    }

  } else {

    // The conversation was deleted.

    return 'conversation action pending';

  }

});

