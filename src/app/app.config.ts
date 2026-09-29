import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  APP_INITIALIZER, // 1. Import APP_INITIALIZER
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { initializeApp } from 'firebase/app'; // 2. Import Firebase initialization

import { LibraryEffects } from './core/store/library/library.effects';
import { libraryFeature } from './core/store/library/library.feature';
import { PlayerEffects } from './core/store/player/player.effects';
import { playerFeature } from './core/store/player/player.feature';
import { PlaylistEffects } from './core/store/playlist/playlist.effects';
import { playlistFeature } from './core/store/playlist/playlist.feature';
import { SettingsEffects } from './core/store/settings/settings.effects';
import { settingsFeature } from './core/store/settings/settings.feature';
import { routes } from './app.routes';

// Paste your Firebase Config object safely here
const firebaseConfig = {
  apiKey: "AIzaSyBcjNEpljQLnPzSXh1j_Oek-hnpaPossI8",
  authDomain: "://firebaseapp.com",
  projectId: "music-app-67e7d",
  storageBucket: "music-app-67e7d.firebasestorage.app",
  messagingSenderId: "1018752265774",
  appId: "1:1018752265774:web:e63cd8d36057e5d47379bf"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    provideRouter(routes, withComponentInputBinding()),

    // 3. Initialize Firebase seamlessly during application startup
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => initializeApp(firebaseConfig),
      multi: true,
    },

    provideStore({
      [libraryFeature.name]: libraryFeature.reducer,
      [playerFeature.name]: playerFeature.reducer,
      [playlistFeature.name]: playlistFeature.reducer,
      [settingsFeature.name]: settingsFeature.reducer,
    }),
    provideEffects([
      LibraryEffects,
      PlayerEffects,
      PlaylistEffects,
      SettingsEffects,
    ]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
