import { Component, OnInit, AfterContentInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, ChartOptions, registerables } from 'chart.js';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../shared/services/auth/auth.service';
import { TicketsService } from '../../shared/services/tickets/tickets.service';

Chart.register(...registerables);

import * as moment from 'moment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterContentInit {

  public ticketsByDepartmentChartSetup!: Chart;
  @ViewChild('ticketsByDepartmentChart', { static: true }) public ticketsByDepartmentChartElement!: ElementRef;

  public defaultLogo: string = 'https://images.unsplash.com/photo-1593642532744-d377ab507dc8?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80';
  public branding!: any;
  public userData!: any;
  public assignedTicketCount!: any;
  public thisMonthsTicketCount!: any;
  public thisMonthsAssignedTicketCount!: any;

  constructor( private authService: AuthService, private ticketService: TicketsService, private toast: ToastrService ) { }

  async ngOnInit() {
    this.userData = await this.authService.GetUser();
    this.ticketService.getBranding().subscribe((observer:any) => {
      this.branding = observer;
    });
    this.assignedTicketCount = await this.ticketService.getUserTicketCount();
    this.fetchMonthlyTicketCount();
    this.fetchUsersAssignedTicketsThisMonth();
  }

  ngAfterContentInit() {
    this.ticketService.getSettings().subscribe((observer:any) => {

      let thisMonth = moment(new Date()).get('month');
      let lastMonth = moment(new Date()).subtract(1, 'month').get('month');

      let setup:any = {data: { labels: [], datasets: [{label: 'Last month', data: [], fill: false, tension: 0.5, borderColor: 'transparent', backgroundColor: 'rgba(33, 160, 134, 0.8)'}, {label: 'This month', data: [], fill: false, tension: 0.5, borderColor: 'transparent', backgroundColor: 'rgba(80, 61, 140, 0.8)'} ] }, type: 'bar', options: { responsive: true, scales: { x: { grid: { display: false }, y: { grid: { display: false } } } }, plugins: { legend: { display: true, position: 'bottom' } } } };

      if(this.ticketsByDepartmentChartSetup) {
        this.ticketsByDepartmentChartSetup.destroy();
      }

      Object.keys(observer.departments).forEach((key:any) => {
        if(observer.departments[key].key !== 'closed') {
          setup.data.labels[key] = observer.departments[key].value;
          this.ticketService.getMonthlyTicketsByDepartment(lastMonth, observer.departments[key].key).then((results) => {
            setup.data.datasets[0].data.push(results);
            this.ticketsByDepartmentChartSetup.update();
          });
          this.ticketService.getMonthlyTicketsByDepartment(thisMonth, observer.departments[key].key).then((results) => {
            setup.data.datasets[1].data.push(results);
            this.ticketsByDepartmentChartSetup.update();
          });
        }
      });

      this.ticketsByDepartmentChartSetup = new Chart(this.ticketsByDepartmentChartElement.nativeElement, setup);

    });
  }

  async fetchMonthlyTicketCount(update?:boolean) {
    this.thisMonthsTicketCount = await this.ticketService.getThisMonthsTicketCount();
    if(update) {
      this.toast.success('Stat updated');
    }
  }

  async fetchUsersAssignedTicketsThisMonth(update?:boolean) {
    this.thisMonthsAssignedTicketCount = await this.ticketService.getUsersAssignedTicketsThisMonth();
    if(update) {
      this.toast.success('Stat updated');
    }
  }

}
