import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../shared/services/auth/auth.service';
import { TicketsService } from '../../shared/services/tickets/tickets.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  public userData!: any;
  public assignedTickedCount!: any;

  constructor( private authService: AuthService, private ticketService: TicketsService ) { }

  async ngOnInit() {
    this.userData = await this.authService.GetUser();
    this.assignedTickedCount = await this.ticketService.getUserTicketCount();
  }

}
