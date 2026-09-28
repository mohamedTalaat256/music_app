import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'library' },
  {
    path: 'library',
    title: 'Library · Music',
    loadComponent: () =>
      import('./features/library/library.component').then(
        (m) => m.LibraryComponent,
      ),
  },
  {
    path: 'playlists',
    title: 'Playlists · Music',
    loadComponent: () =>
      import('./features/playlists/playlists.component').then(
        (m) => m.PlaylistsComponent,
      ),
  },
  {
    path: 'search',
    title: 'Search · Music',
    loadComponent: () =>
      import('./features/search/search.component').then(
        (m) => m.SearchComponent,
      ),
  },
  {
    path: 'youtube',
    title: 'YouTube · Music',
    loadComponent: () =>
      import('./features/youtube/youtube-search.component').then(
        (m) => m.YoutubeSearchComponent,
      ),
  },
  {
    path: 'settings',
    title: 'Settings · Music',
    loadComponent: () =>
      import('./features/settings/settings.component').then(
        (m) => m.SettingsComponent,
      ),
  },
  { path: '**', redirectTo: 'library' },
];
