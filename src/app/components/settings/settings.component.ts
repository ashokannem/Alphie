import { Component, OnInit } from '@angular/core';
import { Router, Event, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  public active!: string;

  constructor( private router: Router ) { }

  ngOnInit(): void {
    this.active = this.router.url.split('/')[2];
  }

}
