import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { switchMap, first, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';

import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _allUserData = new BehaviorSubject<any>([]);
  public allUserData = this._allUserData.asObservable();

  private _userStats = new BehaviorSubject<any>([]);
  public userStats = this._userStats.asObservable();

  constructor( private ngZone: NgZone, private router: Router, private afAuth: AngularFireAuth, private afs: AngularFirestore, private toastr: ToastrService ) {
    this._allUserData.next(null);
    this.afAuth.authState.subscribe((user) => {
      if(user) {
        this.afs.collection('users').doc(user.uid).ref.onSnapshot((observer) => {
          if(observer.exists) {
            this._allUserData.next(observer.data());
          } else {
            this._allUserData.next(null);
          }
        });
        this.afs.collection('userStats').doc(user.uid).ref.onSnapshot((observer) => {
          if(observer.exists) {
            this._userStats.next(observer.data());
          } else {
            this._userStats.next(null);
          }
        })
      } else {
        this._allUserData.next(null);
      }
    });
  }

  SignIn(email:string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password).then((result:any) => {
      this.ngZone.run(() => {
        this.router.navigate(['dashboard']);
      });
      this.setUserData(result.user);
    }).catch((error) => {
      this.toastr.error(error.message, 'Whoops!');
    });
  }

  SignInWithGoogle() {
    return new Promise((resolve, reject) => {

      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({
        hd: 'et-kc.com'
      });

      this.afAuth.signInWithPopup(provider).then((userData) => {
        this.setUserData(userData.user).then(() => {
          this.ngZone.run(() => {
            this.router.navigate(['dashboard']);
          });
        }).catch((error:any) => {
          console.log(error);
          this.SignOut();
        })
      })

    })
  }

  SignOut() {
    return this.afAuth.signOut().then(() => {
      this.ngZone.run(() => {
        this._allUserData.next(null);
        this.router.navigate(['login']);
      });
    });
  }

  IsUser() {
    let user = this.afAuth.user;
    return user ? true : false;
  }

  GetUser() {
    return this.allUserData.pipe(first()).toPromise();
  }

  setUserData(user:any):any {
    return new Promise((resolve, reject) => {
      const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
      const userData: any = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
      }
      userRef.set(userData, {
        merge: true
      }).then(() => {
        resolve('updated');
      }).catch((err) => {
        reject(err.message);
      });
    });
    
  }

}