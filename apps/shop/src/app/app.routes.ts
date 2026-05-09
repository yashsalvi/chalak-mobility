import { Route } from '@angular/router';
import { authGuard } from './features/auth/guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home').then(m => m.Home),
  },
  {
    path: 'vehicles',
    loadComponent: () =>
      import('./features/vehicles/vehicles').then(m => m.Vehicles),
  },
  {
    path: 'vehicles/:id',
    loadComponent: () =>
      import('./features/vehicles/vehicle-detail/vehicle-detail.component').then(m => m.VehicleDetailComponent),
  },
  {
    path: 'plans',
    loadComponent: () =>
      import('./features/pricing/pricing').then(m => m.Pricing),
  },
  {
    path: 'business',
    loadComponent: () =>
      import('./features/business/business').then(m => m.Business),
  },
  {
    path: 'booking',
    loadComponent: () =>
      import('./features/home/booking/booking').then(m => m.Booking),
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login').then(m => m.LoginComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register').then(m => m.RegisterComponent),
  },
  {
    path: 'auth/otp',
    loadComponent: () =>
      import('./features/auth/otp').then(m => m.OtpComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/profile').then(m => m.ProfileComponent),
  },
  {
    path: 'bookings',
    loadComponent: () =>
      import('./features/home/booking/booking-success/booking-success').then(m => m.BookingSuccess),
  },
  {
    path: 'bookings/:reference',
    loadComponent: () =>
      import('./features/home/booking/booking-success/booking-success').then(m => m.BookingSuccess),
  },
  {
    path: '**',
    redirectTo: '',
  }
];