import { Route } from '@angular/router';

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