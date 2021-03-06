import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../shared/services/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  public config: any;
  public loginForm!: FormGroup;

  constructor( public authService: AuthService ) { }

  ngOnInit(): void {
    this.config = environment.appConfig;
    this.loginForm = new FormGroup({
      'username' : new FormControl('', [Validators.required]),
      'password' : new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(12)])
    });
  }

  attemptLogin() {
    this.authService.SignIn(`${this.loginForm.controls['username'].value}@${this.config.emailDomain}`, this.loginForm.controls['password'].value).then(() => {

    }).catch((error:any) => {

    });
  }

  attemptLoginWithGoogle() {
    if(this.config.allowGoogleLogin) {
      this.authService.SignInWithGoogle();
    }
  }

}
