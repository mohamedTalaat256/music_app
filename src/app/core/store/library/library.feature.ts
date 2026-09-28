import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { Song } from '../../../shared/models';
import { LibraryActions } from './library.actions';

export interface LibraryState {
  songs: Song[];
  loading: boolean;
  importing: boolean;
  error: string | null;
}

const initialState: LibraryState = {
  songs: [],
  loading: false,
  importing: false,
  error: null,
};

export const libraryFeature = createFeature({
  name: 'library',
  reducer: createReducer(
    initialState,
    on(LibraryActions.loadSongs, (state) => ({ ...state, loading: true, error: null })),
    on(LibraryActions.loadSongsSuccess, (state, { songs }) => ({
      ...state,
      songs,
      loading: false,
    })),
    on(LibraryActions.loadSongsFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),

    on(LibraryActions.importFiles, LibraryActions.importAssets, (state) => ({
      ...state,
      importing: true,
      error: null,
    })),
    on(LibraryActions.importSuccess, (state, { songs }) => ({
      ...state,
      importing: false,
      songs: mergeSongs(state.songs, songs),
    })),
    on(LibraryActions.importFailure, (state, { error }) => ({
      ...state,
      importing: false,
      error,
    })),

    on(LibraryActions.songDeleted, (state, { id }) => ({
      ...state,
      songs: state.songs.filter((s) => s.id !== id),
    })),
  ),
  extraSelectors: ({ selectSongs }) => ({
    selectSongCount: createSelector(selectSongs, (songs) => songs.length),
    selectSongEntities: createSelector(
      selectSongs,
      (songs) => new Map(songs.map((s) => [s.id, s])),
    ),
  }),
});

function mergeSongs(existing: Song[], incoming: Song[]): Song[] {
  const known = new Set(existing.map((s) => s.id));
  const added = incoming.filter((s) => !known.has(s.id));
  return [...added, ...existing];
}

export const {
  name: libraryFeatureKey,
  reducer: libraryReducer,
  selectSongs,
  selectLoading: selectLibraryLoading,
  selectImporting: selectLibraryImporting,
  selectError: selectLibraryError,
  selectSongCount,
  selectSongEntities,
} = libraryFeature;
