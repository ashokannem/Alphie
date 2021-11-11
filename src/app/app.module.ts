import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AutosizeModule } from 'ngx-autosize';
import { ToastrModule } from 'ngx-toastr';
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';
import { MomentModule } from 'ngx-moment';
import { PickerModule } from '@ctrl/ngx-emoji-mart';

import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

import { AngularFireModule } from '@angular/fire/compat/';
import { AngularFireAuthModule, PERSISTENCE } from '@angular/fire/compat/auth';
import { AngularFireAuthGuardModule } from '@angular/fire/compat/auth-guard';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireFunctionsModule } from '@angular/fire/compat/functions';
import { AngularFireMessagingModule } from '@angular/fire/compat/messaging';
import { AngularFireRemoteConfigModule } from '@angular/fire/compat/remote-config';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';

import { environment } from '../environments/environment';

import { initializeApp,provideFirebaseApp } from '@angular/fire/app';

import { LoginComponent } from './components/auth/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { MessagesComponent } from './components/messages/messages.component';
import { UserPipe } from './shared/pipes/user.pipe';
import { StatusPipe } from './shared/pipes/status.pipe';
import { TruncatePipe } from './shared/pipes/truncate.pipe';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { TicketsComponent } from './components/tickets/tickets.component';
import { ToWordsPipe } from './shared/pipes/to-words.pipe';
import { SettingsComponent } from './components/settings/settings.component';
import { PublicComponent } from './components/public/public.component';
import { NewTicketComponent } from './components/public/new-ticket/new-ticket.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    MessagesComponent,
    UserPipe,
    StatusPipe,
    TruncatePipe,
    TicketsComponent,
    ToWordsPipe,
    SettingsComponent,
    PublicComponent,
    NewTicketComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    ToastrModule.forRoot(),
    LoadingBarRouterModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFireAuthGuardModule,
    AngularFirestoreModule,
    AngularFireFunctionsModule,
    AngularFireMessagingModule,
    AngularFireRemoteConfigModule,
    AngularFireStorageModule,
    BsDropdownModule.forRoot(),
    CollapseModule.forRoot(),
    ModalModule.forRoot(),
    TooltipModule.forRoot(),
    AutosizeModule,
    MomentModule,
    TypeaheadModule.forRoot(),
    PickerModule

  ],
  providers: [
    {
      provide: PERSISTENCE, useValue: 'session'
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
