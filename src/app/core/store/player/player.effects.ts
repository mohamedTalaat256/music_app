import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { EMPTY, from, map, mergeMap, tap, withLatestFrom } from 'rxjs';
import { RepeatMode, Song } from '../../../shared/models';
import { AudioEngineService } from '../../services/audio-engine.service';
import { selectSongEntities } from '../library/library.feature';
import { PlayerActions } from './player.actions';
import { playerFeature } from './player.feature';

@Injectable()
export class PlayerEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly engine = inject(AudioEngineService);

  constructor() {
    // Auto-advance when the current track finishes.
    this.engine.onEnded(() => this.store.dispatch(PlayerActions.trackEnded()));
  }

  loadTrack$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PlayerActions.playSong),
        tap(({ song }) => void this.engine.loadTrack(song.url, true)),
      ),
    { dispatch: false },
  );

  play$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PlayerActions.play),
        tap(() => void this.engine.play()),
      ),
    { dispatch: false },
  );

  pause$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PlayerActions.pause),
        tap(() => this.engine.pause()),
      ),
    { dispatch: false },
  );

  stop$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PlayerActions.stop),
        tap(() => this.engine.stop()),
      ),
    { dispatch: false },
  );

  togglePlay$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlayerActions.togglePlay),
      map(() =>
        this.engine.isPlaying() ? PlayerActions.pause() : PlayerActions.play(),
      ),
    ),
  );

  next$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlayerActions.next),
      withLatestFrom(
        this.store.select(playerFeature.selectPlayerState),
        this.store.select(selectSongEntities),
      ),
      mergeMap(([, state, entities]) => {
        const nextId = this.computeNext(
          state.queue,
          state.currentSongId,
          state.repeatMode,
        );
        return this.dispatchForId(nextId, entities);
      }),
    ),
  );

  previous$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlayerActions.previous),
      withLatestFrom(
        this.store.select(playerFeature.selectPlayerState),
        this.store.select(selectSongEntities),
      ),
      mergeMap(([, state, entities]) => {
        // Restart current track if we're more than 3s in.
        if (this.engine.currentTime() > 3) {
          this.engine.seek(0);
          return EMPTY;
        }
        const prevId = this.computePrevious(
          state.queue,
          state.currentSongId,
          state.repeatMode,
        );
        return this.dispatchForId(prevId, entities);
      }),
    ),
  );

  trackEnded$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlayerActions.trackEnded),
      withLatestFrom(
        this.store.select(playerFeature.selectPlayerState),
        this.store.select(selectSongEntities),
      ),
      mergeMap(([, state, entities]) => {
        if (state.repeatMode === RepeatMode.One) {
          this.engine.seek(0);
          void this.engine.play();
          return EMPTY;
        }
        const nextId = this.computeNext(
          state.queue,
          state.currentSongId,
          state.repeatMode,
        );
        if (!nextId) {
          return from([PlayerActions.stop()]);
        }
        return this.dispatchForId(nextId, entities);
      }),
    ),
  );

  private dispatchForId(
    id: string | null,
    entities: Map<string, Song>,
  ): Action[] {
    if (!id) return [];
    const song = entities.get(id);
    return song ? [PlayerActions.playSong({ song })] : [];
  }

  private computeNext(
    queue: string[],
    currentId: string | null,
    repeat: RepeatMode,
  ): string | null {
    if (!queue.length) return null;
    if (!currentId) return queue[0];
    const idx = queue.indexOf(currentId);
    if (idx < 0) return queue[0];
    if (idx < queue.length - 1) return queue[idx + 1];
    return repeat === RepeatMode.All ? queue[0] : null;
  }

  private computePrevious(
    queue: string[],
    currentId: string | null,
    repeat: RepeatMode,
  ): string | null {
    if (!queue.length) return null;
    if (!currentId) return queue[0];
    const idx = queue.indexOf(currentId);
    if (idx <= 0) {
      return repeat === RepeatMode.All ? queue[queue.length - 1] : queue[0];
    }
    return queue[idx - 1];
  }
}
