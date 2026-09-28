import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { from, map, mergeMap, tap, withLatestFrom } from 'rxjs';
import { AppSettings } from '../../../shared/models';
import { AudioEngineService } from '../../services/audio-engine.service';
import { StorageService } from '../../services/storage.service';
import { ThemeService } from '../../services/theme.service';
import { SettingsActions } from './settings.actions';
import { settingsFeature } from './settings.feature';

@Injectable()
export class SettingsEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly storage = inject(StorageService);
  private readonly theme = inject(ThemeService);
  private readonly engine = inject(AudioEngineService);

  loadSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SettingsActions.loadSettings),
      mergeMap(() =>
        from(this.storage.getSettings()).pipe(
          map((settings) => SettingsActions.loadSettingsSuccess({ settings })),
        ),
      ),
    ),
  );

  /** Apply theme + audio effects whenever settings load. */
  applyLoaded$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SettingsActions.loadSettingsSuccess),
        tap(({ settings }) => {
          this.theme.setTheme(settings.theme);
          this.engine.setVolume(settings.volume);
          this.engine.applyEqualizer(settings.effects.equalizer);
          this.engine.applyBassBoost(settings.effects.bassBoost);
          void this.engine.applyReverb(settings.effects.reverb);
        }),
      ),
    { dispatch: false },
  );

  applyTheme$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SettingsActions.setTheme),
        tap(({ theme }) => this.theme.setTheme(theme)),
      ),
    { dispatch: false },
  );

  applyVolume$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SettingsActions.setVolume),
        tap(({ volume }) => this.engine.setVolume(volume)),
      ),
    { dispatch: false },
  );

  applyEqualizer$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SettingsActions.updateEqualizer),
        tap(({ equalizer }) => this.engine.applyEqualizer(equalizer)),
      ),
    { dispatch: false },
  );

  applyReverb$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SettingsActions.updateReverb),
        tap(({ reverb }) => void this.engine.applyReverb(reverb)),
      ),
    { dispatch: false },
  );

  applyBassBoost$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SettingsActions.updateBassBoost),
        tap(({ bassBoost }) => this.engine.applyBassBoost(bassBoost)),
      ),
    { dispatch: false },
  );

  /** Persist the full settings object after any change. */
  persist$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          SettingsActions.setTheme,
          SettingsActions.setVolume,
          SettingsActions.setVisualizerMode,
          SettingsActions.setSongsFolder,
          SettingsActions.updateEqualizer,
          SettingsActions.updateReverb,
          SettingsActions.updateBassBoost,
        ),
        withLatestFrom(this.store.select(settingsFeature.selectSettingsState)),
        tap(([, state]) => {
          const { loaded: _loaded, ...settings } = state;
          void this.storage.saveSettings(settings as AppSettings);
        }),
      ),
    { dispatch: false },
  );
}
