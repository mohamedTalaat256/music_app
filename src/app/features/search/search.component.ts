import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { debounceTime } from 'rxjs';
import { Playlist, Song } from '../../shared/models';
import { SongListComponent } from '../../shared/ui/song-list/song-list.component';
import { selectSongs } from '../../core/store/library/library.feature';
import { PlayerActions } from '../../core/store/player/player.actions';
import { selectCurrentSongId } from '../../core/store/player/player.feature';
import { PlaylistActions } from '../../core/store/playlist/playlist.actions';

/** Instant, debounced search across title, artist, album and genre. */
@Component({
  selector: 'app-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, SongListComponent],
  template: `
    <section class="page">
      <div class="search glass">
        <mat-icon>search</mat-icon>
        <input
          type="search"
          placeholder="Search by title, artist, album or genre…"
          [value]="query()"
          (input)="onInput($event)"
          autofocus
          aria-label="Search songs"
        />
        @if (query()) {
          <button class="clear" (click)="clear()" aria-label="Clear search">
            <mat-icon>close</mat-icon>
          </button>
        }
      </div>

      <p class="muted">
        {{ results().length }}
        {{ results().length === 1 ? 'result' : 'results' }}
        @if (debouncedQuery()) {
          for “{{ debouncedQuery() }}”
        }
      </p>

      <div class="list glass">
        <app-song-list
          [songs]="results()"
          [currentSongId]="currentSongId()"
          [emptyMessage]="
            debouncedQuery() ? 'No matches found.' : 'Start typing to search.'
          "
          (play)="onPlay($event)"
          (addToPlaylist)="onAddToPlaylist($event)"
        />
      </div>
    </section>
  `,
  styleUrl: './search.component.scss',
})
export class SearchComponent {
  private readonly store = inject(Store);

  private readonly songs = this.store.selectSignal(selectSongs);
  readonly currentSongId = this.store.selectSignal(selectCurrentSongId);

  protected readonly query = signal('');
  readonly debouncedQuery = toSignal(
    toObservable(this.query).pipe(debounceTime(200)),
    { initialValue: '' },
  );

  readonly results = computed<Song[]>(() => {
    const term = this.debouncedQuery().trim().toLowerCase();
    if (!term) return this.songs();
    return this.songs().filter((s) =>
      [s.title, s.artist, s.album, s.genre]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  });

  onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  clear(): void {
    this.query.set('');
  }

  onPlay(song: Song): void {
    this.store.dispatch(
      PlayerActions.playSong({
        song,
        queue: this.results().map((s) => s.id),
      }),
    );
  }

  onAddToPlaylist({ song, playlist }: { song: Song; playlist: Playlist }): void {
    this.store.dispatch(
      PlaylistActions.addSongToPlaylist({
        playlistId: playlist.id,
        songId: song.id,
      }),
    );
  }
}
