import { createFeature, createReducer, on } from '@ngrx/store';
import { Playlist } from '../../../shared/models';
import { PlaylistActions } from './playlist.actions';

export interface PlaylistState {
  playlists: Playlist[];
  loading: boolean;
}

const initialState: PlaylistState = {
  playlists: [],
  loading: false,
};

export const playlistFeature = createFeature({
  name: 'playlist',
  reducer: createReducer(
    initialState,
    on(PlaylistActions.loadPlaylists, (state) => ({ ...state, loading: true })),
    on(PlaylistActions.loadPlaylistsSuccess, (state, { playlists }) => ({
      ...state,
      playlists,
      loading: false,
    })),
    on(PlaylistActions.playlistUpserted, (state, { playlist }) => {
      const others = state.playlists.filter((p) => p.id !== playlist.id);
      return {
        ...state,
        playlists: [playlist, ...others].sort(
          (a, b) => b.updatedDate - a.updatedDate,
        ),
      };
    }),
    on(PlaylistActions.playlistRemoved, (state, { id }) => ({
      ...state,
      playlists: state.playlists.filter((p) => p.id !== id),
    })),
  ),
});

export const {
  name: playlistFeatureKey,
  reducer: playlistReducer,
  selectPlaylists,
  selectLoading: selectPlaylistsLoading,
} = playlistFeature;
