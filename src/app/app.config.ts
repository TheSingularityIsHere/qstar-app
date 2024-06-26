import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { firebaseConfig } from '../environments/firebase.config';
import { routes } from './app.routes';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
      provideFirebaseApp(() => initializeApp(firebaseConfig)),
      provideDatabase(() => getDatabase()
    ),
    // Alternative: https://github.com/rafgraph/spa-github-pages
    // { provide: LocationStrategy, useClass: HashLocationStrategy},
  ]
};
