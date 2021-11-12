import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TicketsService } from '../../../shared/services/tickets/tickets.service';

@Component({
  selector: 'app-ticket-settings',
  templateUrl: './ticket-settings.component.html',
  styleUrls: ['./ticket-settings.component.css']
})
export class TicketSettingsComponent implements OnInit {

  @ViewChild('textToCopy') private textToCopy!: ElementRef;

  public hasTickets: boolean = false;
  public ticketPageUrl!: string;
  public saving: boolean = false;
  public settingsForm: FormGroup = new FormGroup({
    'headerText' : new FormControl('', [Validators.required, Validators.minLength(24), Validators.maxLength(84)]),
    'publicTicketPage' : new FormControl(true),
    'returnUrl' : new FormControl('', [Validators.required]),
    'startingTicketNumber' : new FormControl(null, [Validators.required]),
    'ticketPageClosedText' : new FormControl('', [Validators.minLength(24), Validators.maxLength(84)])
  });

  constructor( @Inject(DOCUMENT) private document:any, private toast: ToastrService, public ticketService: TicketsService ) { }

  ngOnInit(): void {
    this.ticketService.getAll().subscribe((tickets:any) => {
      if(tickets.length > 0) {
        this.hasTickets = true;
        this.settingsForm.controls['startingTicketNumber'].disable();
        this.settingsForm.controls['startingTicketNumber'].updateValueAndValidity();
      } else {
        this.hasTickets = false;
        this.settingsForm.controls['startingTicketNumber'].enable();
        this.settingsForm.controls['startingTicketNumber'].updateValueAndValidity();
      }
    })
    this.ticketPageUrl = `${document.location.origin}/public/ticket/create`;
    this.ticketService.getSettings().subscribe((settings:any) => {
      Object.keys(this.settingsForm.controls).forEach((field:any) => {
        if(settings[field] !== undefined) {
          this.settingsForm.controls[field].setValue(settings[field]);
          this.settingsForm.controls[field].updateValueAndValidity();
        }
      })
    })
  }

  copyToClipboard(val:string) {
    this.textToCopy.nativeElement.focus();
    this.textToCopy.nativeElement.select();
    document.execCommand('copy');
    this.toast.success('Public Url Copied To Clipbboard!');
  }

  saveChanges() {
    this.saving = true;
    if(this.settingsForm.valid && this.settingsForm.touched) {
      this.settingsForm.disable();
      let data: any = {};
      Object.keys(this.settingsForm.controls).forEach((field:any) => {
        data[field] = this.settingsForm.controls[field].value;
      })
      this.ticketService.saveSettings(data).then(() => {
        this.toast.success('Settings updated', 'Success');
        this.saving = false;
        this.settingsForm.markAsUntouched();
        this.settingsForm.enable();
      }).catch((error:any) => {
        this.toast.error(error.message, 'Error');
        this.saving = false;
        this.settingsForm.enable();
      })
    } else {
      if(!this.settingsForm.valid) {
        this.saving = false;
        this.toast.error('You have missing fields.', 'Error');
        this.settingsForm.enable();
      } else {
        this.saving = false;
        this.toast.error('No changed detected.', 'Error');
        this.settingsForm.enable();
      }
    }
  }

}
