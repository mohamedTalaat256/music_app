import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { BUNDLED_SONG_PATHS } from './core/asset-songs';
import { AudioEngineService } from './core/services/audio-engine.service';
import { LibraryActions } from './core/store/library/library.actions';
import { PlaylistActions } from './core/store/playlist/playlist.actions';
import { SettingsActions } from './core/store/settings/settings.actions';
import { selectVisualizerMode } from './core/store/settings/settings.feature';
import { selectCurrentSong } from './core/store/player/player.feature';
import { PlayerBarComponent } from './features/player/player-bar.component';
import { VisualizerComponent } from './shared/ui/visualizer/visualizer.component';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

/** Application shell: navigation, routed content, now-playing dock. */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatTooltipModule,
    PlayerBarComponent,
    VisualizerComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly store = inject(Store);
  // Eagerly instantiate the engine so the Web Audio graph is ready.
  private readonly engine = inject(AudioEngineService);

  readonly currentSong = this.store.selectSignal(selectCurrentSong);
  readonly visualizerMode = this.store.selectSignal(selectVisualizerMode);

  protected readonly nav: NavItem[] = [
    { path: '/library', label: 'Library', icon: 'library_music' },
    { path: '/playlists', label: 'Playlists', icon: 'queue_music' },
    { path: '/search', label: 'Search', icon: 'search' },
    { path: '/youtube', label: 'YouTube', icon: 'smart_display' },
    { path: '/settings', label: 'Settings', icon: 'tune' },
  ];

  ngOnInit(): void {
    this.store.dispatch(SettingsActions.loadSettings());
    this.store.dispatch(LibraryActions.loadSongs());
    this.store.dispatch(PlaylistActions.loadPlaylists());
    // Import the tracks that ship with the app (deduplicated in the effect).
    this.store.dispatch(
      LibraryActions.importAssets({ paths: [...BUNDLED_SONG_PATHS] }),
    );
  }
}

