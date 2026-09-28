import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { Playlist, Song } from '../../shared/models';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { selectSongEntities } from '../../core/store/library/library.feature';
import { PlayerActions } from '../../core/store/player/player.actions';
import { selectCurrentSongId } from '../../core/store/player/player.feature';
import { PlaylistActions } from '../../core/store/playlist/playlist.actions';
import { selectPlaylists } from '../../core/store/playlist/playlist.feature';

@Component({
  selector: 'app-playlists',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    DurationPipe,
  ],
  template: `
    <section class="page">
      <!-- Master: playlist list -->
      <aside class="master glass">
        <h1>Playlists</h1>
        <form class="create" (submit)="create($event)">
          <input
            [value]="newName()"
            (input)="newName.set($any($event.target).value)"
            placeholder="New playlist name"
            aria-label="New playlist name"
          />
          <button mat-flat-button color="primary" type="submit">
            <mat-icon>add</mat-icon>
          </button>
        </form>

        <ul class="pl-list">
          @for (pl of playlists(); track pl.id) {
            <li
              class="pl-item"
              [class.active]="pl.id === selectedId()"
              (click)="select(pl.id)"
            >
              <mat-icon>queue_music</mat-icon>
              @if (editingId() === pl.id) {
                <input
                  class="rename"
                  [value]="editName()"
                  (input)="editName.set($any($event.target).value)"
                  (keyup.enter)="commitRename(pl)"
                  (blur)="commitRename(pl)"
                  (click)="$event.stopPropagation()"
                />
              } @else {
                <span class="name" (dblclick)="startRename(pl)">{{ pl.name }}</span>
              }
              <span class="count">{{ pl.songIds.length }}</span>
              <button
                class="mini"
                (click)="remove(pl, $event)"
                aria-label="Delete playlist"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </li>
          } @empty {
            <li class="empty">No playlists yet. Create one above.</li>
          }
        </ul>
      </aside>

      <!-- Detail: selected playlist songs -->
      <div class="detail glass">
        @if (selected(); as pl) {
          <header class="detail-head">
            <div>
              <h2>{{ pl.name }}</h2>
              <p class="muted">{{ songs().length }} tracks · drag to reorder</p>
            </div>
            <button
              mat-flat-button
              color="primary"
              [disabled]="!songs().length"
              (click)="playAll()"
            >
              <mat-icon>play_arrow</mat-icon> Play
            </button>
          </header>

          <div cdkDropList class="tracks" (cdkDropListDropped)="drop($event)">
            @for (song of songs(); track song.id) {
              <div
                class="track"
                cdkDrag
                [class.active]="song.id === currentSongId()"
              >
                <mat-icon class="handle" cdkDragHandle>drag_indicator</mat-icon>
                <button class="art" (click)="play(song)" aria-label="Play">
                  @if (song.artwork) {
                    <img [src]="song.artwork" [alt]="song.album" />
                  } @else {
                    <mat-icon>music_note</mat-icon>
                  }
                </button>
                <div class="meta">
                  <span class="title">{{ song.title }}</span>
                  <span class="artist">{{ song.artist }}</span>
                </div>
                <span class="time">{{ song.duration | duration }}</span>
                <button
                  class="mini"
                  (click)="removeSong(pl, song)"
                  aria-label="Remove from playlist"
                >
                  <mat-icon>remove_circle_outline</mat-icon>
                </button>
              </div>
            } @empty {
              <div class="empty-detail">
                <mat-icon>library_music</mat-icon>
                <p>This playlist is empty. Add songs from your library.</p>
              </div>
            }
          </div>
        } @else {
          <div class="empty-detail">
            <mat-icon>queue_music</mat-icon>
            <p>Select or create a playlist to get started.</p>
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: './playlists.component.scss',
})
export class PlaylistsComponent {
  private readonly store = inject(Store);

  readonly playlists = this.store.selectSignal(selectPlaylists);
  readonly currentSongId = this.store.selectSignal(selectCurrentSongId);
  private readonly entities = this.store.selectSignal(selectSongEntities);

  protected readonly newName = signal('');
  protected readonly selectedId = signal<string | null>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly editName = signal('');

  readonly selected = computed<Playlist | null>(() => {
    const id = this.selectedId();
    return this.playlists().find((p) => p.id === id) ?? this.playlists()[0] ?? null;
  });

  readonly songs = computed<Song[]>(() => {
    const pl = this.selected();
    if (!pl) return [];
    const map = this.entities();
    return pl.songIds
      .map((id) => map.get(id))
      .filter((s): s is Song => s != null);
  });

  select(id: string): void {
    this.selectedId.set(id);
  }

  create(event: Event): void {
    event.preventDefault();
    const name = this.newName().trim();
    if (!name) return;
    this.store.dispatch(PlaylistActions.createPlaylist({ name }));
    this.newName.set('');
  }

  remove(pl: Playlist, event: Event): void {
    event.stopPropagation();
    this.store.dispatch(PlaylistActions.deletePlaylist({ id: pl.id }));
    if (this.selectedId() === pl.id) this.selectedId.set(null);
  }

  startRename(pl: Playlist): void {
    this.editingId.set(pl.id);
    this.editName.set(pl.name);
  }

  commitRename(pl: Playlist): void {
    if (this.editingId() !== pl.id) return;
    const name = this.editName().trim();
    if (name && name !== pl.name) {
      this.store.dispatch(PlaylistActions.renamePlaylist({ id: pl.id, name }));
    }
    this.editingId.set(null);
  }

  removeSong(pl: Playlist, song: Song): void {
    this.store.dispatch(
      PlaylistActions.removeSongFromPlaylist({
        playlistId: pl.id,
        songId: song.id,
      }),
    );
  }

  drop(event: CdkDragDrop<Song[]>): void {
    const pl = this.selected();
    if (!pl) return;
    const songIds = [...pl.songIds];
    moveItemInArray(songIds, event.previousIndex, event.currentIndex);
    this.store.dispatch(
      PlaylistActions.reorderPlaylistSongs({ playlistId: pl.id, songIds }),
    );
  }

  play(song: Song): void {
    this.store.dispatch(
      PlayerActions.playSong({ song, queue: this.songs().map((s) => s.id) }),
    );
  }

  playAll(): void {
    const first = this.songs()[0];
    if (first) this.play(first);
  }
}
