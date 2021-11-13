import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { UsersService } from '../../../shared/services/users/users.service';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.css']
})
export class UserSettingsComponent implements OnInit {

  public users: any = [];

  public saving: boolean = false;
  public newUserForm: FormGroup = new FormGroup({
    'displayName' : new FormControl('', [Validators.required, Validators.minLength(2)]),
    'email' : new FormControl('', [Validators.required])
  });

  constructor( private userService: UsersService, private authService: AuthService, private toast: ToastrService ) { }

  ngOnInit(): void {
    this.userService.GetAll().then( async(data:any) => {
      let { uid } = await this.authService.GetUser();
      let users:any = [];
      data.forEach((data:any) => {
        let user = data.data();
        if(user.uid !== uid) {
          users.push(user);
        }
      });
      this.users = users;
    });
  }

  addUser() {
    this.saving = true;
    if(this.newUserForm.valid) {
      this.userService.CreateUser({
        'displayName' : this.newUserForm.controls['displayName'].value,
        'email' : `${this.newUserForm.controls['email'].value}@et-kc.com`,
        'emailVerified' : false,
        'photoURL' : null,
        'unreadMessageCount' : 0,
        'userActiveChat' : null
      }).then((user:any) => {
        this.toast.success(`${this.newUserForm.controls['displayName'].value} was invited. Invite sent to ${this.newUserForm.controls['email'].value}@et-kc.com.`, 'Success');
        this.saving = false;
      }).catch((error:any) => {
        this.toast.error(error.message, 'Error');
        this.saving = false;
      })
    } else {
      this.toast.error('All fields required', 'Error');
      this.saving = false;
    }
  }

}
