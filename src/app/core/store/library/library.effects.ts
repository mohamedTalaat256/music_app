import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, mergeMap, of } from 'rxjs';
import { Song } from '../../../shared/models';
import { MetadataService } from '../../services/metadata.service';
import { StorageService } from '../../services/storage.service';
import { LibraryActions } from './library.actions';

@Injectable()
export class LibraryEffects {
  private readonly actions$ = inject(Actions);
  private readonly storage = inject(StorageService);
  private readonly metadata = inject(MetadataService);

  /** Load persisted songs and refresh any stale imported object URLs. */
  loadSongs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LibraryActions.loadSongs),
      mergeMap(() =>
        from(this.rehydrateSongs()).pipe(
          map((songs) => LibraryActions.loadSongsSuccess({ songs })),
          catchError((err) =>
            of(LibraryActions.loadSongsFailure({ error: String(err) })),
          ),
        ),
      ),
    ),
  );

  importFiles$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LibraryActions.importFiles),
      mergeMap(({ files }) =>
        from(this.processFiles(files)).pipe(
          map((songs) => LibraryActions.importSuccess({ songs })),
          catchError((err) =>
            of(LibraryActions.importFailure({ error: String(err) })),
          ),
        ),
      ),
    ),
  );

  importAssets$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LibraryActions.importAssets),
      mergeMap(({ paths }) =>
        from(this.processAssets(paths)).pipe(
          map((songs) => LibraryActions.importSuccess({ songs })),
          catchError((err) =>
            of(LibraryActions.importFailure({ error: String(err) })),
          ),
        ),
      ),
    ),
  );

  deleteSong$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LibraryActions.deleteSong),
      mergeMap(({ id }) =>
        from(this.storage.deleteSong(id)).pipe(
          map(() => LibraryActions.songDeleted({ id })),
          catchError(() => of(LibraryActions.songDeleted({ id }))),
        ),
      ),
    ),
  );

  private async rehydrateSongs(): Promise<Song[]> {
    const songs = await this.storage.getAllSongs();
    return Promise.all(
      songs.map(async (song) => {
        if (song.source.kind === 'imported') {
          const blob = await this.storage.getSongBlob(song.id);
          if (blob) {
            return { ...song, url: URL.createObjectURL(blob) };
          }
        }
        return song;
      }),
    );
  }

  private async processFiles(files: File[]): Promise<Song[]> {
    const results: Song[] = [];
    for (const file of files) {
      const { song, blob } = await this.metadata.fromFile(file);
      await this.storage.putSong(song, blob);
      results.push(song);
    }
    return results;
  }

  private async processAssets(paths: string[]): Promise<Song[]> {
    const existing = await this.storage.getAllSongs();
    const knownAssetPaths = new Set(
      existing
        .filter((s) => s.source.kind === 'asset')
        .map((s) => (s.source as { kind: 'asset'; path: string }).path),
    );
    const results: Song[] = [];
    for (const path of paths) {
      if (knownAssetPaths.has(path)) continue;
      try {
        const { song, blob } = await this.metadata.fromAsset(path);
        await this.storage.putSong(song, blob);
        results.push(song);
      } catch {
        // Skip assets that fail to load.
      }
    }
    return results;
  }
}
