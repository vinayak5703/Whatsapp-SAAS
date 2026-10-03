import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then((page) => page.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then((page) => page.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then((page) => page.ForgotPasswordComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/app-shell.component').then((page) => page.AppShellComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then((page) => page.DashboardComponent) },
      { path: 'contacts/new', loadComponent: () => import('./features/contacts/contact-form/contact-form.component').then((page) => page.ContactFormComponent) },
      { path: 'contacts', loadComponent: () => import('./features/contacts/contact-list/contact-list.component').then((page) => page.ContactListComponent) },
      { path: 'groups', loadComponent: () => import('./features/groups/group-list/group-list.component').then((page) => page.GroupListComponent) },
      { path: 'messages/send', loadComponent: () => import('./features/messaging/send-message/send-message.component').then((page) => page.SendMessageComponent) },
      { path: 'messaging/send', redirectTo: 'messages/send' },
      { path: 'messages/bulk', loadComponent: () => import('./features/campaigns/campaign-list/campaign-list.component').then((page) => page.CampaignListComponent) },
      { path: 'campaigns/new', loadComponent: () => import('./features/campaigns/campaign-form/campaign-form.component').then((page) => page.CampaignFormComponent) },
      { path: 'campaigns', loadComponent: () => import('./features/campaigns/campaign-list/campaign-list.component').then((page) => page.CampaignListComponent) },
      { path: 'media', loadComponent: () => import('./shared/resource-page/resource-page.component').then((page) => page.ResourcePageComponent), data: { resourceKey: 'media' } },
      { path: 'reports/:reportType', loadComponent: () => import('./shared/resource-page/resource-page.component').then((page) => page.ResourcePageComponent), data: { resourceKey: 'reports' } },
      { path: 'reports', loadComponent: () => import('./shared/resource-page/resource-page.component').then((page) => page.ResourcePageComponent), data: { resourceKey: 'reports' } },
      { path: 'logs/:logType', loadComponent: () => import('./shared/resource-page/resource-page.component').then((page) => page.ResourcePageComponent), data: { resourceKey: 'logs' } },
      { path: 'logs', loadComponent: () => import('./shared/resource-page/resource-page.component').then((page) => page.ResourcePageComponent), data: { resourceKey: 'logs' } },
      { path: 'whatsapp', loadComponent: () => import('./features/whatsapp/connection/whatsapp-connection.component').then((page) => page.WhatsappConnectionComponent) },
      { path: 'settings/:section', loadComponent: () => import('./shared/resource-page/resource-page.component').then((page) => page.ResourcePageComponent), data: { resourceKey: 'settings' } },
      { path: 'settings', loadComponent: () => import('./shared/resource-page/resource-page.component').then((page) => page.ResourcePageComponent), data: { resourceKey: 'settings' } },
      { path: 'help', loadComponent: () => import('./features/help/help-center.component').then((page) => page.HelpCenterComponent) },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
