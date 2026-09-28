import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { Playlist, Song } from '../../models';
import { DurationPipe } from '../../pipes/duration.pipe';
import { playlistFeature } from '../../../core/store/playlist/playlist.feature';

/**
 * Reusable, virtualized list of songs. Purely presentational: it renders rows
 * and emits intents (play, delete, add-to-playlist) for the host to handle.
 */
@Component({
  selector: 'app-song-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ScrollingModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    DurationPipe,
  ],
  template: `
    @if (songs().length === 0) {
      <div class="empty">
        <mat-icon>library_music</mat-icon>
        <p>{{ emptyMessage() }}</p>
      </div>
    } @else {
      <cdk-virtual-scroll-viewport itemSize="64" class="viewport">
        <div
          *cdkVirtualFor="let song of songs(); trackBy: trackById"
          class="song-row"
          [class.active]="song.id === currentSongId()"
          (dblclick)="play.emit(song)"
        >
          <button
            class="art"
            type="button"
            (click)="play.emit(song)"
            [attr.aria-label]="'Play ' + song.title"
          >
            @if (song.artwork) {
              <img [src]="song.artwork" [alt]="song.album" />
            } @else {
              <mat-icon>music_note</mat-icon>
            }
            <span class="play-overlay"><mat-icon>play_arrow</mat-icon></span>
          </button>

          <div class="meta">
            <span class="title" [title]="song.title">{{ song.title }}</span>
            <span class="artist">{{ song.artist }}</span>
          </div>

          <span class="album">{{ song.album }}</span>
          <span class="time">{{ song.duration | duration }}</span>

          <button
            class="icon-btn"
            type="button"
            [matMenuTriggerFor]="menu"
            matTooltip="More"
            aria-label="Song actions"
          >
            <mat-icon>more_vert</mat-icon>
          </button>

          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="play.emit(song)">
              <mat-icon>play_arrow</mat-icon><span>Play</span>
            </button>
            @if (playlists().length) {
              <button mat-menu-item [matMenuTriggerFor]="plMenu">
                <mat-icon>playlist_add</mat-icon><span>Add to playlist</span>
              </button>
            }
            <button mat-menu-item (click)="remove.emit(song)">
              <mat-icon>delete</mat-icon><span>Remove</span>
            </button>
          </mat-menu>

          <mat-menu #plMenu="matMenu">
            @for (pl of playlists(); track pl.id) {
              <button
                mat-menu-item
                (click)="addToPlaylist.emit({ song, playlist: pl })"
              >
                {{ pl.name }}
              </button>
            }
          </mat-menu>
        </div>
      </cdk-virtual-scroll-viewport>
    }
  `,
  styleUrl: './song-list.component.scss',
})
export class SongListComponent {
  private readonly store = inject(Store);

  readonly songs = input.required<Song[]>();
  readonly currentSongId = input<string | null>(null);
  readonly emptyMessage = input('No songs yet.');

  readonly play = output<Song>();
  readonly remove = output<Song>();
  readonly addToPlaylist = output<{ song: Song; playlist: Playlist }>();

  readonly playlists = this.store.selectSignal(playlistFeature.selectPlaylists);

  protected trackById(_index: number, song: Song): string {
    return song.id;
  }
}
