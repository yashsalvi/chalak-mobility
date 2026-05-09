import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'vehicles',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'vehicles/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      return [
        { id: 'scooter-001' },
        { id: 'tempo-001' },
        { id: 'delivery-001' }
      ];
    }
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
