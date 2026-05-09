import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

bootstrapApplication(App, appConfig)
  .then(app => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator && environment.production) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered successfully:', registration);
        })
        .catch((err: any) => console.error('Service worker registration failed:', err));
    }
  })
  .catch((err) => console.error(err));
