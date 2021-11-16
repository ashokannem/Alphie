import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Subscription, interval } from 'rxjs';
import { AuthService } from '../../shared/services/auth/auth.service';
import { TicketsService } from '../../shared/services/tickets/tickets.service';

@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.css']
})
export class TicketsComponent implements OnInit, OnDestroy {

  @ViewChild('newTicketModal', { static: true }) newTicketModalTemplate!: TemplateRef<unknown>;

  public newTicketData: any = [];

  public responseMessage!: string;

  public departments!: any;
  public departmentOptions: any = [];

  public priorities: any = [{ key: 0, value: 'undetermined' },{ key: 1, value: 'low' },{ key: 2, value: 'medium' },{ key: 3, value: 'high' },{ key: 4, value: 'urgent' }]

  private rawTickets: any = [];

  public tickets: any = [];

  public ticket: any;

  private timerSubscription!: Subscription;

  public dateNow = new Date();
  public dDay = new Date('Nov 7 2021 20:30:01');

  milliSecondsInASecond = 1000;
  hoursInADay = 24;
  minutesInAnHour = 60;
  SecondsInAMinute = 60;

  public timeDifference!: number;
  public secondsToDday!: number;
  public minutesToDday!: number;
  public hoursToDday!: number;
  public daysToDday!: number;

  public modalRef?: BsModalRef;

  public filterCount: number = 0;
  public filter!: string;

  constructor( private ticketService: TicketsService, private authService: AuthService, private modalService: BsModalService, private route: ActivatedRoute ) { }

  ngOnInit(): void {
    this.ticketService.getSettings().subscribe((settings:any) => {
      this.departments = settings.departments.sort((a:any, b:any) => a.order - b.order );
      this.route.params.subscribe((params:any) => {
        if(params.filter) {
          this.filterCount = 1;
          this.filter = params.filter;
          if(params.filter === 'closed') {
            this.departments.forEach((department:any, index:any) => {
              if(department.key !== 'closed') {
                this.departments[index]['hidden'] = true;
                this.departments[index]['collapsed'] = false;
              }
            })
          }
        }
      });
      this.route.queryParams.subscribe((queryParams:any) => {
        if(queryParams) {
          if(queryParams.action === 'create') {
            this.newTicket(this.newTicketModalTemplate);
          } 
        }
      });
      settings.departments.forEach((department:any, index:number) => {
        if(!this.tickets[department.key]) {
          this.tickets[department.key] = [];
        }
        if(department.key !== 'closed') {
          this.departmentOptions.push(department);
        } else {
          if(this.filter !== 'closed') {
            this.departments[index]['collapsed'] = true;
          }
        }
      })
    });
    this.ticketService.getAll().subscribe( async(tickets:any) => {
      const { uid } = await this.authService.GetUser();
      tickets.forEach((ticket:any) => {
        if(this.filter === 'assigned-to-me') {
          let doesUserExistOnTicket = ticket.users.find((u:any) => u === uid) ? true : false;
          if(!doesUserExistOnTicket) {
            return;
          }
        } else if(this.filter === 'unassigned') {
          if(ticket.users) {
            return;
          }
        }
        let didTicketExist = this.rawTickets.find((t:any) => t.id === ticket.id);
        if(didTicketExist) {
          if(this.ticket) {
            if(this.ticket.id === ticket.id) {
              this.ticket = ticket;
              if(ticket.response_due) {
                this.dDay = new Date(ticket.response_due.seconds*1000);
                this.timerSubscription = interval(1000).subscribe(x => { this.getTimeDifference(); });
              } else {
                if(this.timerSubscription) {
                  this.timerSubscription.unsubscribe();
                }
              }
            }
          }
          if(didTicketExist.department !== ticket.department) {
            let oldDepartmentTicketIndex = this.tickets[didTicketExist.department].findIndex((t:any) => t.id === ticket.id);
            this.tickets[didTicketExist.department].splice(oldDepartmentTicketIndex, 1);
            this.tickets[ticket.department].push(ticket);
          } else {
            let existingTicketIndex = this.tickets[ticket.department].findIndex((t:any) => t.id === ticket.id);
            this.tickets[ticket.department][existingTicketIndex] = ticket;
          }
        } else {
          this.tickets[ticket.department].push(ticket);
        }
        this.tickets[ticket.department].sort((c:any, d:any) => (d.created.seconds*1000) - (c.created.seconds*1000)).sort((a:any, b:any) => b.priority - a.priority);
      
      });
      this.rawTickets = tickets;
    });
  }

  selectTicket(ticket:any) {
    this.ticket = ticket;
    this.ticket.messages.sort((a:any, b:any) => (a.created.seconds*1000) - (b.created.seconds*1000));
    if(ticket.response_due) {
      this.dDay = new Date(ticket.response_due.seconds*1000);
      this.timerSubscription = interval(1000).subscribe(x => { this.getTimeDifference(); });
    } else {
      if(this.timerSubscription) {
        this.timerSubscription.unsubscribe();
      }
    }
  }

  setPriority(priority:number) {
    this.ticketService.updatePriority(this.ticket.id, priority);
  }

  setDepartment(department:string) {
    this.ticketService.updateDepartment(this.ticket.id, department, this.ticket.department);
  }

  closeTicket() {
    this.ticketService.closeTicket(this.ticket);
  }

  async newResponse(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }
  sendNewResponse() {
    if(this.responseMessage) {
      this.ticketService.addMessage(this.ticket, this.responseMessage);
      this.modalRef?.hide();
    }
  }

  async newTicket(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }
  createNewTicket() {
    let data = this.newTicketData;
    if(data.customerName && data.customerEmail && data.department && data.priority && data.subject && data.body) {
      this.ticketService.createOne(data).then(() => {
        this.modalRef?.hide();
      }).catch((error:any) => {
        window.alert(error.message);
      })
    } else {
      window.alert('All fields are required!');
    }
  }

  private getTimeDifference() {
    this.timeDifference = this.dDay.getTime() - new Date().getTime();
    this.allocateTimeUnits(this.timeDifference);
  }

  private allocateTimeUnits(timeDifference:any) {
    this.secondsToDday = Math.floor((timeDifference) / (this.milliSecondsInASecond) % this.SecondsInAMinute);
    this.minutesToDday = Math.floor((timeDifference) / (this.milliSecondsInASecond * this.minutesInAnHour) % this.SecondsInAMinute);
    this.hoursToDday = Math.floor((timeDifference) / (this.milliSecondsInASecond * this.minutesInAnHour * this.SecondsInAMinute) % this.hoursInADay);
    this.daysToDday = Math.floor((timeDifference) / (this.milliSecondsInASecond * this.minutesInAnHour * this.SecondsInAMinute * this.hoursInADay));
  }

  ngOnDestroy() {
    if(this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

}