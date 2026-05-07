import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'booking',
    renderMode: RenderMode.Server,
  },
  {
    path: 'bookings/:reference',
    renderMode: RenderMode.Server,
  },
  {
    path: 'bookings',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
