import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth/auth.service';
import { UsersService } from '../../shared/services/users/users.service';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  public saving: boolean = false;

  public config!: any;

  public profilePic!: any;

  public profileForm: FormGroup = new FormGroup({
    'status' : new FormControl('', [Validators.required]),
    'displayName' : new FormControl('', [Validators.required, Validators.minLength(2)]),
    'email' : new FormControl('', [Validators.required]),
    'photoURL' : new FormControl(''),
    'customPhotoURL' : new FormControl(false)
  })
  public userData!: any;

  constructor( private toast: ToastrService, public authService: AuthService, private userService: UsersService, private storage: AngularFireStorage ) { }

  async ngOnInit() {
    this.config = environment.appConfig;
    this.userData = await this.authService.GetUser();
    this.profileForm.controls['status'].setValue(this.userData.status);
    this.profileForm.controls['displayName'].setValue(this.userData.displayName);
    this.profileForm.controls['email'].setValue((this.userData.email.split('@')[0]));
    this.profileForm.controls['photoURL'].setValue(this.userData.photoURL);
  }

  onFileSelect($event:any) {
    console.log($event.target.files[0]);
    const file = $event.target.files[0];
    const filePath = `internal/${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    task.snapshotChanges().pipe(finalize(() => {
      fileRef.getDownloadURL().toPromise().then((downloadUrl) => {
        this.profileForm.controls['photoURL'].setValue(downloadUrl);
        this.profileForm.controls['photoURL'].updateValueAndValidity();
        this.profileForm.controls['customPhotoURL'].setValue(true);
        this.profileForm.controls['customPhotoURL'].updateValueAndValidity();
        this.profileForm.markAsTouched();
      })
    })).subscribe();
  }

  saveChanges() {
    this.saving = true;
    if(this.profileForm.valid && this.profileForm.touched) {
      this.profileForm.disable();
      let data: any = {};
      Object.keys(this.profileForm.controls).forEach((field:any) => {
        if(field === 'email') {
          data[field] = `${this.profileForm.controls[field].value}@${environment.appConfig.emailDomain}`
        } else {
          data[field] = this.profileForm.controls[field].value;
        }
      })
      this.userService.UpdateUser(this.userData.uid, data).then(() => {
        this.toast.success('Settings updated', 'Success');
        this.saving = false;
        this.profileForm.markAsUntouched();
        this.profileForm.enable();
      }).catch((error:any) => {
        this.toast.error(error.message, 'Error');
        this.saving = false;
        this.profileForm.enable();
      })
    } else {
      if(!this.profileForm.valid) {
        this.saving = false;
        this.toast.error('You have missing fields.', 'Error');
        this.profileForm.enable();
      } else {
        this.saving = false;
        this.toast.error('No changed detected.', 'Error');
        this.profileForm.enable();
      }
    }
  }

}
