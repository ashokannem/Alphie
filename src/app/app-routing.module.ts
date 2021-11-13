import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AngularFireAuthGuard, redirectUnauthorizedTo, redirectLoggedInTo } from '@angular/fire/compat/auth-guard';

import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MessagesComponent } from './components/messages/messages.component';
import { TicketsComponent } from './components/tickets/tickets.component';

import { SettingsComponent } from './components/settings/settings.component';
import { BrandingSettingsComponent } from './components/settings/branding-settings/branding-settings.component';
import { TicketSettingsComponent } from './components/settings/ticket-settings/ticket-settings.component';
import { NotificationSettingsComponent } from './components/settings/notification-settings/notification-settings.component';
import { DepartmentSettingsComponent } from './components/settings/department-settings/department-settings.component';
import { UserSettingsComponent } from './components/settings/user-settings/user-settings.component';

import { PublicComponent } from './components/public/public.component';
import { NewTicketComponent } from './components/public/new-ticket/new-ticket.component';

import { LoginComponent } from './components/auth/login/login.component';
import { InviteComponent } from './components/auth/invite/invite.component';

const redirectLoggedInToDashboard = () => redirectLoggedInTo(['/dashboard']);
const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['/login']);

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'public',
    component: PublicComponent,
    children: [
      {
        path: '',
        redirectTo: 'ticket/create',
        pathMatch: 'full'
      },
      {
        path: 'ticket/create',
        component: NewTicketComponent
      }
    ]
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [AngularFireAuthGuard],
    data: {
      authGuardPipe: redirectLoggedInToDashboard
    }
  },
  {
    path: 'userInvite/:inviteID',
    component: InviteComponent,
    canActivate: [AngularFireAuthGuard],
    data: {
      authGuardPipe: redirectLoggedInToDashboard
    }
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AngularFireAuthGuard],
    data: {
      authGuardPipe: redirectUnauthorizedToLogin
    },
    children: [
      {
        path: '',
        redirectTo: 'branding',
        pathMatch: 'full'
      },
      {
        path: 'branding',
        component: BrandingSettingsComponent
      },
      {
        path: 'users',
        component: UserSettingsComponent
      },
      {
        path: 'tickets',
        component: TicketSettingsComponent
      },
      {
        path: 'notifications',
        component: NotificationSettingsComponent
      },
      {
        path: 'departments',
        component: DepartmentSettingsComponent
      }
    ]
  },
  {
    path: 'messages',
    component: MessagesComponent,
    canActivate: [AngularFireAuthGuard],
    data: {
      authGuardPipe: redirectUnauthorizedToLogin
    }
  },
  {
    path: 'messages/:id',
    component: MessagesComponent,
    canActivate: [AngularFireAuthGuard],
    data: {
      authGuardPipe: redirectUnauthorizedToLogin
    }
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AngularFireAuthGuard],
    data: {
      authGuardPipe: redirectUnauthorizedToLogin
    }
  },
  {
    path: 'tickets',
    component: TicketsComponent,
    canActivate: [AngularFireAuthGuard],
    data: {
      authGuardPipe: redirectUnauthorizedToLogin
    }
  },
  {
    path: 'tickets/filter/:filter',
    component: TicketsComponent,
    canActivate: [AngularFireAuthGuard],
    data: {
      authGuardPipe: redirectUnauthorizedToLogin
    }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
