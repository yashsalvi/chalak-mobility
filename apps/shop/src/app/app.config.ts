import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  importProvidersFrom,
} from '@angular/core';

import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { I18nService } from './services/i18n.service';

import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { LucideAngularModule } from 'lucide-angular';
import {
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  Box,
  Briefcase,
  Calendar,
  CalendarCheck,
  Car,
  ChevronDown,
  Check,
  Clock,
  Download,
  Globe,
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
    provideAnimations(),
    I18nService,
    // ✅ Lucide configuration with explicit icons
    importProvidersFrom(
      LucideAngularModule.pick({
        AlertTriangle,
        ArrowUp,
        ArrowRight,
        Box,
        Briefcase,
        Calendar,
        CalendarCheck,
        Car,
        ChevronDown,
        Check,
        Clock,
        Download,
        Globe,
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
