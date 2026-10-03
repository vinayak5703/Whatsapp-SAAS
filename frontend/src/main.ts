import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import {
  Activity, ArrowDownRight, ArrowLeft, ArrowUpRight, BarChart3, ChevronDown, CircleAlert,
  CircleHelp, Clock3, ContactRound, FileImage, LayoutDashboard, LogOut, LucideAngularModule,
  Menu, MessageCircle, Plus, Radio, RefreshCw, Search, Send, Settings, UserRound, UsersRound, X,
} from 'lucide-angular';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/auth/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    importProvidersFrom(LucideAngularModule.pick({
      Activity, ArrowDownRight, ArrowLeft, ArrowUpRight, BarChart3, ChevronDown, CircleAlert,
      CircleHelp, Clock3, ContactRound, FileImage, LayoutDashboard, LogOut, Menu, MessageCircle,
      Plus, Radio, RefreshCw, Search, Send, Settings, UserRound, UsersRound, X,
    })),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
}).catch((error: unknown) => console.error(error));