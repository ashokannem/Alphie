import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UsersService } from '../../../shared/services/users/users.service';

@Component({
  selector: 'app-notification-settings',
  templateUrl: './notification-settings.component.html',
  styleUrls: ['./notification-settings.component.css']
})
export class NotificationSettingsComponent implements OnInit {

  public methods: any = [];
  public actions: any = [];

  public saving: boolean = false;
  public notificationForm: FormGroup = new FormGroup({});

  constructor( private toast: ToastrService, public userService: UsersService ) { }

  ngOnInit(): void {
    this.userService.GetNotiPrefs().then((userPrefs) => {
      this.notificationForm = new FormGroup({});
      this.notificationForm.updateValueAndValidity();
      userPrefs.forEach((deliveryMethod:any) => {
        Object.keys(deliveryMethod).forEach((method:any) => {
          let findMethod = this.methods.findIndex((m:any) => m === method) > -1 ? true : false;
          if(!findMethod) {
            this.methods.push(method);
          }
          Object.keys(deliveryMethod[method]).forEach((action:any) => {
            let findAction = this.actions.findIndex((a:any) => a.key === action );

            if(findAction < 0) {
              this.actions.push({
                key: action,
                value: action.split(/(?=[A-Z])/).join().replace(/,/g, ' ').toLowerCase(),
                method: method,
                formControl: `${method}-${action}`
              });
              this.notificationForm.registerControl(`${method}-${action}`, new FormControl(deliveryMethod[method][action], [Validators.required]));
              this.notificationForm.controls[`${method}-${action}`].updateValueAndValidity();
            } else {
              this.actions[findAction] = {
                key: action,
                value: action.split(/(?=[A-Z])/).join().replace(/,/g, ' ').toLowerCase(),
                method: method,
                formControl: `${method}-${action}`
              }
              this.notificationForm.controls[`${method}-${action}`].setValue(deliveryMethod[method][action]);
              this.notificationForm.controls[`${method}-${action}`].updateValueAndValidity();
            }
          });
        });
      })
    })
  }

  saveChanges() {
    this.saving = true;
    if(this.notificationForm.valid && this.notificationForm.touched) {
      this.notificationForm.disable();
      let data: any = {};
      this.methods.forEach((method:any) => {
        data[method] = {};
        this.actions.forEach((action:any) => {
          if(action.method === method) {
            data[method][action.key] = this.notificationForm.controls[`${method}-${action.key}`].value;
          }
        });
      });
      this.userService.UpdateNotiPrefs(data).then(() => {
        this.toast.success('Settings updated', 'Success');
        this.saving = false;
        this.notificationForm.markAsUntouched();
        this.notificationForm.enable();
      }).catch((error:any) => {
        this.toast.error(error.message, 'Error');
        this.saving = false;
        this.notificationForm.enable();
      });
    } else {
      if(!this.notificationForm.valid) {
        this.saving = false;
        this.toast.error('You have missing fields.', 'Error');
        this.notificationForm.enable();
      } else {
        this.saving = false;
        this.toast.error('No changed detected.', 'Error');
        this.notificationForm.enable();
      }
    }
  }

}
