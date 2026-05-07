import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  importProvidersFrom,
} from '@angular/core';

import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { appRoutes } from './app.routes';

import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { LucideAngularModule } from 'lucide-angular';
import {
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  Briefcase,
  Calendar,
  CalendarCheck,
  Car,
  ChevronDown,
  Check,
  Clock,
  Download,
  House,
  LayoutList,
  List,
  MapPin,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Truck,
  User,
  Wallet,
  Wrench,
  X,
  Zap,
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withFetch()),
    // ✅ Lucide configuration with explicit icons
    importProvidersFrom(
      LucideAngularModule.pick({
        AlertTriangle,
        ArrowUp,
        ArrowRight,
        Briefcase,
        Calendar,
        CalendarCheck,
        Car,
        ChevronDown,
        Check,
        Clock,
        Download,
        House,
        LayoutList,
        List,
        MapPin,
        RefreshCw,
        Search,
        Settings,
        ShieldCheck,
        Smartphone,
        TrendingUp,
        Truck,
        User,
        Wallet,
        Wrench,
        X,
        Zap,
      })
    ),
  ],
};
