import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AppComponent } from '../../../app.component';
import { TicketsService } from '../../../shared/services/tickets/tickets.service';

@Component({
  selector: 'app-new-ticket',
  templateUrl: './new-ticket.component.html',
  styleUrls: ['./new-ticket.component.css'],
  providers: [AppComponent]
})
export class NewTicketComponent implements OnInit {

  public creating: boolean = false;

  public settings!: any;
  public branding!: any;
  public departments: any = [];
  public priorities: any = [{ key: 1, value: 'low' },{ key: 2, value: 'medium' },{ key: 3, value: 'high' },{ key: 4, value: 'urgent' }]

  public ticketForm: FormGroup = new FormGroup({
    'name' : new FormControl('', [Validators.required]),
    'email' : new FormControl('', [Validators.required]),
    'department' : new FormControl(null, [Validators.required]),
    'priority' : new FormControl(null, [Validators.required]),
    'subject' : new FormControl('', [Validators.required]),
    'body' : new FormControl('', [Validators.required])
  });

  constructor( public appComponent: AppComponent, private ticketsService: TicketsService ) { }

  ngOnInit(): void {
    this.ticketsService.getBranding().subscribe((brandingSettings) => {
      if(brandingSettings) {
        this.branding = brandingSettings;
      }
    });
    this.ticketsService.getSettings().subscribe((ticketSettings) => {
      if(ticketSettings) {
        this.settings = ticketSettings;
        if(ticketSettings.departments) {
          ticketSettings.departments.forEach((ticketDepartment:any) => {
            if(ticketDepartment.key !== 'closed') {
              if(ticketDepartment.key == 'undetermined') {
                ticketDepartment.value = 'Unknown';
              }
              this.departments.push(ticketDepartment);
            }
          });
          this.departments.sort((a:any, b:any) => a.order - b.order );
        }
      }
    });
  }

  cancel() {
    this.ticketForm.reset();
  }

  createTicket() {
    this.appComponent.loading = true;
    this.ticketForm.disable();
    this.creating = true;
    this.ticketsService.createOne({
      'customerName' : this.ticketForm.controls['name'].value,
      'customerEmail' : this.ticketForm.controls['email'].value,
      'department' : this.ticketForm.controls['department'].value,
      'priority' : this.ticketForm.controls['priority'].value,
      'subject' : this.ticketForm.controls['subject'].value,
      'body' : this.ticketForm.controls['body'].value,
    }, 'public').then(() => {
      this.ticketForm.enable();
      this.creating = false;
      this.appComponent.loading = false;
    }).catch((error:any) => {
      this.ticketForm.enable();
      this.creating = false;
      this.appComponent.loading = false;
    });
  }

}
