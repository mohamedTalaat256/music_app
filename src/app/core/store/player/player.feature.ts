import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { PlaybackStatus, RepeatMode } from '../../../shared/models';
import { selectSongEntities } from '../library/library.feature';
import { PlayerActions } from './player.actions';

export interface PlayerState {
  currentSongId: string | null;
  status: PlaybackStatus;
  queue: string[];
  originalQueue: string[];
  shuffle: boolean;
  repeatMode: RepeatMode;
}

const initialState: PlayerState = {
  currentSongId: null,
  status: 'stopped',
  queue: [],
  originalQueue: [],
  shuffle: false,
  repeatMode: RepeatMode.Off,
};

export const playerFeature = createFeature({
  name: 'player',
  reducer: createReducer(
    initialState,
    on(PlayerActions.playSong, (state, { song, queue }) => {
      const nextQueue = queue ?? state.queue;
      return {
        ...state,
        currentSongId: song.id,
        status: 'playing' as PlaybackStatus,
        queue: nextQueue,
        originalQueue: queue ? nextQueue : state.originalQueue,
      };
    }),
    on(PlayerActions.setQueue, (state, { songIds }) => ({
      ...state,
      queue: songIds,
      originalQueue: songIds,
    })),
    on(PlayerActions.play, (state) => ({ ...state, status: 'playing' as PlaybackStatus })),
    on(PlayerActions.pause, (state) => ({ ...state, status: 'paused' as PlaybackStatus })),
    on(PlayerActions.stop, (state) => ({ ...state, status: 'stopped' as PlaybackStatus })),
    on(PlayerActions.statusChanged, (state, { playing }) => ({
      ...state,
      status: playing ? ('playing' as PlaybackStatus) : ('paused' as PlaybackStatus),
    })),
    on(PlayerActions.toggleShuffle, (state) => {
      if (state.shuffle) {
        return { ...state, shuffle: false, queue: state.originalQueue };
      }
      return {
        ...state,
        shuffle: true,
        queue: shuffleKeepingCurrent(state.queue, state.currentSongId),
      };
    }),
    on(PlayerActions.setRepeatMode, (state, { mode }) => ({
      ...state,
      repeatMode: mode,
    })),
    on(PlayerActions.cycleRepeat, (state) => ({
      ...state,
      repeatMode: nextRepeat(state.repeatMode),
    })),
  ),
  extraSelectors: ({ selectCurrentSongId }) => ({
    selectCurrentSong: createSelector(
      selectCurrentSongId,
      selectSongEntities,
      (id, entities) => (id ? entities.get(id) ?? null : null),
    ),
  }),
});

function nextRepeat(mode: RepeatMode): RepeatMode {
  switch (mode) {
    case RepeatMode.Off:
      return RepeatMode.All;
    case RepeatMode.All:
      return RepeatMode.One;
    default:
      return RepeatMode.Off;
  }
}

function shuffleKeepingCurrent(
  queue: string[],
  currentId: string | null,
): string[] {
  const rest = queue.filter((id) => id !== currentId);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return currentId ? [currentId, ...rest] : rest;
}

export const {
  name: playerFeatureKey,
  reducer: playerReducer,
  selectCurrentSongId,
  selectStatus,
  selectQueue,
  selectShuffle,
  selectRepeatMode,
  selectCurrentSong,
} = playerFeature;
