import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { TicketsService } from '../../../shared/services/tickets/tickets.service';

@Component({
  selector: 'app-branding-settings',
  templateUrl: './branding-settings.component.html',
  styleUrls: ['./branding-settings.component.css']
})
export class BrandingSettingsComponent implements OnInit {

  public saving: boolean = false;
  public logoFile!: any;
  public brandingForm: FormGroup = new FormGroup({
    'companyName' : new FormControl('', [Validators.required, Validators.minLength(2)]),
    'logo' : new FormControl(''),
    'primaryColor' : new FormControl('', [Validators.required]),
    'secondaryColor' : new FormControl('', [Validators.required])
  });

  constructor( @Inject(DOCUMENT) private document:any, private toast: ToastrService, public ticketService: TicketsService, private storage: AngularFireStorage ) { }

  ngOnInit(): void {
    this.ticketService.getBranding().subscribe((settings:any) => {
      Object.keys(this.brandingForm.controls).forEach((field:any) => {
        if(settings[field] !== undefined) {
          this.brandingForm.controls[field].setValue(settings[field]);
          this.brandingForm.controls[field].updateValueAndValidity();
        }
      })
    })
  }

  onFileSelect($event:any) {
    console.log($event.target.files[0]);
    const file = $event.target.files[0];
    const filePath = `internal/${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    task.snapshotChanges().pipe(finalize(() => {
      fileRef.getDownloadURL().toPromise().then((downloadUrl) => {
        this.brandingForm.controls['logo'].setValue(downloadUrl);
        this.brandingForm.controls['logo'].updateValueAndValidity();
        this.brandingForm.markAsTouched();
      })
    })).subscribe();
  }

  saveChanges() {
    this.saving = true;
    if(this.brandingForm.valid && this.brandingForm.touched) {
      this.brandingForm.disable();
      let data: any = {};
      Object.keys(this.brandingForm.controls).forEach((field:any) => {
        data[field] = this.brandingForm.controls[field].value;
      })
      this.ticketService.saveBranding(data).then(() => {
        this.toast.success('Settings updated', 'Success');
        this.saving = false;
        this.brandingForm.markAsUntouched();
        this.brandingForm.enable();
      }).catch((error:any) => {
        this.toast.error(error.message, 'Error');
        this.saving = false;
        this.brandingForm.enable();
      })
    } else {
      if(!this.brandingForm.valid) {
        this.saving = false;
        this.toast.error('You have missing fields.', 'Error');
        this.brandingForm.enable();
      } else {
        this.saving = false;
        this.toast.error('No changed detected.', 'Error');
        this.brandingForm.enable();
      }
    }
  }

}
