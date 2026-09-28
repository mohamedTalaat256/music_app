import { createFeature, createReducer, on } from '@ngrx/store';
import { AppSettings, DEFAULT_SETTINGS } from '../../../shared/models';
import { SettingsActions } from './settings.actions';

export interface SettingsState extends AppSettings {
  loaded: boolean;
}

const initialState: SettingsState = {
  ...DEFAULT_SETTINGS,
  loaded: false,
};

export const settingsFeature = createFeature({
  name: 'settings',
  reducer: createReducer(
    initialState,
    on(SettingsActions.loadSettingsSuccess, (state, { settings }) => ({
      ...state,
      ...settings,
      loaded: true,
    })),
    on(SettingsActions.setTheme, (state, { theme }) => ({ ...state, theme })),
    on(SettingsActions.setVolume, (state, { volume }) => ({ ...state, volume })),
    on(SettingsActions.setVisualizerMode, (state, { mode }) => ({
      ...state,
      visualizerMode: mode,
    })),
    on(SettingsActions.setSongsFolder, (state, { folder }) => ({
      ...state,
      songsFolder: folder,
    })),
    on(SettingsActions.updateEqualizer, (state, { equalizer }) => ({
      ...state,
      effects: { ...state.effects, equalizer },
    })),
    on(SettingsActions.updateReverb, (state, { reverb }) => ({
      ...state,
      effects: { ...state.effects, reverb },
    })),
    on(SettingsActions.updateBassBoost, (state, { bassBoost }) => ({
      ...state,
      effects: { ...state.effects, bassBoost },
    })),
  ),
});

export const {
  name: settingsFeatureKey,
  reducer: settingsReducer,
  selectTheme,
  selectVolume,
  selectVisualizerMode,
  selectSongsFolder,
  selectEffects,
  selectLoaded: selectSettingsLoaded,
} = settingsFeature;
