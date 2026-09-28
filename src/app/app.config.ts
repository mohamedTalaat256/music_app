import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { LibraryEffects } from './core/store/library/library.effects';
import { libraryFeature } from './core/store/library/library.feature';
import { PlayerEffects } from './core/store/player/player.effects';
import { playerFeature } from './core/store/player/player.feature';
import { PlaylistEffects } from './core/store/playlist/playlist.effects';
import { playlistFeature } from './core/store/playlist/playlist.feature';
import { SettingsEffects } from './core/store/settings/settings.effects';
import { settingsFeature } from './core/store/settings/settings.feature';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    provideRouter(routes, withComponentInputBinding()),

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
