import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  AppSettings,
  BassBoostSettings,
  EqualizerSettings,
  ReverbSettings,
  ThemeMode,
  VisualizerMode,
} from '../../../shared/models';

export const SettingsActions = createActionGroup({
  source: 'Settings',
  events: {
    'Load Settings': emptyProps(),
    'Load Settings Success': props<{ settings: AppSettings }>(),

    'Set Theme': props<{ theme: ThemeMode }>(),
    'Set Volume': props<{ volume: number }>(),
    'Set Visualizer Mode': props<{ mode: VisualizerMode }>(),
    'Set Songs Folder': props<{ folder: string }>(),

    'Update Equalizer': props<{ equalizer: EqualizerSettings }>(),
    'Update Reverb': props<{ reverb: ReverbSettings }>(),
    'Update Bass Boost': props<{ bassBoost: BassBoostSettings }>(),
  },
});
