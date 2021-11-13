import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { TicketsService } from '../../../shared/services/tickets/tickets.service';

@Component({
  selector: 'app-department-settings',
  templateUrl: './department-settings.component.html',
  styleUrls: ['./department-settings.component.css']
})
export class DepartmentSettingsComponent implements OnInit {

  public listStyle = {
    width: '100%',
    height: '100%'
  }

  public newDepartmentName!: string;

  public departments: any = [];

  constructor( public ticketService: TicketsService, private toast: ToastrService ) { }

  ngOnInit(): void {
    this.ticketService.getSettings().subscribe((settings:any) => {
      settings.departments.forEach((department:any) => {
        let findDepartment = this.departments.findIndex((d:any) => d.key === department.key);
        if(findDepartment > -1) {
          this.departments[findDepartment] = {
            'key' : department.key,
            'value' : department.value
          }
        } else {
          this.departments.push(department);
        }
        this.departments.sort((a:any,b:any) => a.order - b.order);
      });
    });
  }

  listOrderChanged(event:any) {
    this.ticketService.saveDepartments(event);
  }

  addDepartment(name:string) {
    this.ticketService.addDepartment({
      'key' : name.toLowerCase(),
      'value' : name
    });
    this.newDepartmentName = '';
  }

  deleteDepartment(key:string) {
    let departmentIndex = this.departments.findIndex((d:any) => d.key === key);
    if(departmentIndex > -1) {
      this.departments = this.departments.slice(departmentIndex, 1);
      this.ticketService.saveDepartments(this.departments);
    }
  }

}
