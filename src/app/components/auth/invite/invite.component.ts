import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UsersService } from '../../../shared/services/users/users.service';
import { AuthService } from '../../../shared/services/auth/auth.service';

@Component({
  selector: 'app-invite',
  templateUrl: './invite.component.html',
  styleUrls: ['./invite.component.css']
})
export class InviteComponent implements OnInit {

  public userName!: string;
  public inviteForm!: FormGroup;

  constructor( public authService: AuthService, public userService: UsersService, private route: ActivatedRoute, private toast: ToastrService ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params:any) => {
      if(params.inviteID) {
        this.userService.RetrieveInvite(params.inviteID).then((inviteDetails:any) => {
          if(inviteDetails) {
            this.userName = inviteDetails.displayName;
            this.inviteForm.controls['email'].setValue(inviteDetails.email);
          } else {
            this.toast.error('Invalid invite code', 'Whoops');
          }
        }).catch((error) => {
          this.toast.error(error, 'Whoops');
        })
      }
    })
    this.inviteForm = new FormGroup({
      'email' : new FormControl({value:'', disabled: true }, [Validators.required]),
      'password' : new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(12)]),
      'cPassword' : new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(12)])
    });
  }

  attemptRegistration() {
    if(this.inviteForm.controls['password'].value === this.inviteForm.controls['cPassword'].value) {
      this.authService.SignUp(this.inviteForm.controls['email'].value, this.inviteForm.controls['password'].value).then(() => {

      }).catch((error:any) => {
        this.toast.error(error.message, 'Whoops');
      });
    } else {
      this.toast.error('Passwords do not match', 'Whoops');
    }
  }

}
