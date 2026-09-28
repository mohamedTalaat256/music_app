import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { isSupportedAudioFile, Playlist, Song } from '../../shared/models';
import { SongListComponent } from '../../shared/ui/song-list/song-list.component';
import { LibraryActions } from '../../core/store/library/library.actions';
import {
  selectLibraryImporting,
  selectSongCount,
  selectSongs,
} from '../../core/store/library/library.feature';
import { PlayerActions } from '../../core/store/player/player.actions';
import { selectCurrentSongId } from '../../core/store/player/player.feature';
import { PlaylistActions } from '../../core/store/playlist/playlist.actions';

/**
 * Library page: import audio (click or drag-and-drop) and browse the collection.
 */
@Component({
  selector: 'app-library',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, SongListComponent],
  template: `
    <section class="page">
      <header class="head">
        <div>
          <h1>Your Library</h1>
          <p class="muted">{{ count() }} {{ count() === 1 ? 'track' : 'tracks' }}</p>
        </div>
        <div class="actions">
          <button mat-flat-button color="primary" (click)="fileInput.click()">
            <mat-icon>upload</mat-icon>
            {{ importing() ? 'Importing…' : 'Import Music' }}
          </button>
          <input
            #fileInput
            type="file"
            hidden
            multiple
            accept="audio/*,.mp3,.wav,.ogg,.aac,.flac,.m4a"
            (change)="onFilesSelected($event)"
          />
        </div>
      </header>

      <div
        class="dropzone glass"
        [class.dragging]="dragging()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        <mat-icon>library_add</mat-icon>
        <span>Drag &amp; drop audio files here to add them to your library</span>
      </div>

      <div class="list glass">
        <app-song-list
          [songs]="songs()"
          [currentSongId]="currentSongId()"
          emptyMessage="Import songs to get started."
          (play)="onPlay($event)"
          (remove)="onRemove($event)"
          (addToPlaylist)="onAddToPlaylist($event)"
        />
      </div>
    </section>
  `,
  styleUrl: './library.component.scss',
})
export class LibraryComponent {
  private readonly store = inject(Store);

  readonly songs = this.store.selectSignal(selectSongs);
  readonly count = this.store.selectSignal(selectSongCount);
  readonly importing = this.store.selectSignal(selectLibraryImporting);
  readonly currentSongId = this.store.selectSignal(selectCurrentSongId);

  protected readonly dragging = signal(false);
  private readonly songIds = computed(() => this.songs().map((s) => s.id));

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.importFiles(input.files);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.importFiles(event.dataTransfer?.files ?? null);
  }

  onPlay(song: Song): void {
    this.store.dispatch(
      PlayerActions.playSong({ song, queue: this.songIds() }),
    );
  }

  onRemove(song: Song): void {
    this.store.dispatch(LibraryActions.deleteSong({ id: song.id }));
  }

  onAddToPlaylist({ song, playlist }: { song: Song; playlist: Playlist }): void {
    this.store.dispatch(
      PlaylistActions.addSongToPlaylist({
        playlistId: playlist.id,
        songId: song.id,
      }),
    );
  }

  private importFiles(fileList: FileList | null): void {
    if (!fileList?.length) return;
    const files = Array.from(fileList).filter((f) =>
      isSupportedAudioFile(f.name),
    );
    if (files.length) {
      this.store.dispatch(LibraryActions.importFiles({ files }));
    }
  }
}
