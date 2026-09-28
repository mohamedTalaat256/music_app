import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { from, map, mergeMap, tap, withLatestFrom } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Playlist } from '../../../shared/models';
import { StorageService } from '../../services/storage.service';
import { PlaylistActions } from './playlist.actions';
import { playlistFeature } from './playlist.feature';

@Injectable()
export class PlaylistEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly storage = inject(StorageService);

  loadPlaylists$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlaylistActions.loadPlaylists),
      mergeMap(() =>
        from(this.storage.getAllPlaylists()).pipe(
          map((playlists) =>
            PlaylistActions.loadPlaylistsSuccess({ playlists }),
          ),
        ),
      ),
    ),
  );

  createPlaylist$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlaylistActions.createPlaylist),
      map(({ name }) => {
        const now = Date.now();
        const playlist: Playlist = {
          id: uuid(),
          name: name.trim() || 'New Playlist',
          songIds: [],
          createdDate: now,
          updatedDate: now,
        };
        return PlaylistActions.playlistUpserted({ playlist });
      }),
    ),
  );

  mutate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        PlaylistActions.renamePlaylist,
        PlaylistActions.addSongToPlaylist,
        PlaylistActions.removeSongFromPlaylist,
        PlaylistActions.reorderPlaylistSongs,
      ),
      withLatestFrom(this.store.select(playlistFeature.selectPlaylists)),
      mergeMap(([action, playlists]) => {
        const target = this.resolveTarget(action, playlists);
        const result: Action[] = target
          ? [PlaylistActions.playlistUpserted({ playlist: target })]
          : [];
        return result;
      }),
    ),
  );

  persistUpsert$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PlaylistActions.playlistUpserted),
        tap(({ playlist }) => void this.storage.putPlaylist(playlist)),
      ),
    { dispatch: false },
  );

  deletePlaylist$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlaylistActions.deletePlaylist),
      mergeMap(({ id }) =>
        from(this.storage.deletePlaylist(id)).pipe(
          map(() => PlaylistActions.playlistRemoved({ id })),
        ),
      ),
    ),
  );

  private resolveTarget(
    action:
      | ReturnType<typeof PlaylistActions.renamePlaylist>
      | ReturnType<typeof PlaylistActions.addSongToPlaylist>
      | ReturnType<typeof PlaylistActions.removeSongFromPlaylist>
      | ReturnType<typeof PlaylistActions.reorderPlaylistSongs>,
    playlists: Playlist[],
  ): Playlist | null {
    const id = 'id' in action ? action.id : action.playlistId;
    const existing = playlists.find((p) => p.id === id);
    if (!existing) return null;
    const now = Date.now();

    switch (action.type) {
      case PlaylistActions.renamePlaylist.type:
        return { ...existing, name: action.name.trim() || existing.name, updatedDate: now };
      case PlaylistActions.addSongToPlaylist.type:
        if (existing.songIds.includes(action.songId)) return existing;
        return {
          ...existing,
          songIds: [...existing.songIds, action.songId],
          updatedDate: now,
        };
      case PlaylistActions.removeSongFromPlaylist.type:
        return {
          ...existing,
          songIds: existing.songIds.filter((s) => s !== action.songId),
          updatedDate: now,
        };
      case PlaylistActions.reorderPlaylistSongs.type:
        return { ...existing, songIds: [...action.songIds], updatedDate: now };
      default:
        return null;
    }
  }
}
