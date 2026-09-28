export type ThemeMode = 'light' | 'dark' | 'system';

export type VisualizerMode = 'bars' | 'mirror' | 'waveform';

/** Six-band graphic equalizer gains in decibels (-12dB..+12dB). */
export interface EqualizerSettings {
  enabled: boolean;
  band60: number;
  band170: number;
  band350: number;
  band1k: number;
  band3_5k: number;
  band10k: number;
}

export type ReverbPreset =
  | 'small-room'
  | 'medium-room'
  | 'large-hall'
  | 'cathedral'
  | 'studio';

/** Convolution-style reverb controls exposed through Tone.Reverb. */
export interface ReverbSettings {
  enabled: boolean;
  preset: ReverbPreset;
  wet: number; // 0..1 wet/dry mix
  decay: number; // seconds
  preDelay: number; // seconds
  roomSize: number; // 0..1 abstract room-size scaler
}

/** Bass enhancement via a low-shelf filter. */
export interface BassBoostSettings {
  enabled: boolean;
  amount: 0 | 25 | 50 | 75 | 100; // percent
}

export interface EffectsSettings {
  equalizer: EqualizerSettings;
  reverb: ReverbSettings;
  bassBoost: BassBoostSettings;
}

export interface AppSettings {
  theme: ThemeMode;
  volume: number; // 0..1
  visualizerMode: VisualizerMode;
  songsFolder: string;
  effects: EffectsSettings;
}

export const REVERB_PRESETS: Record<
  ReverbPreset,
  Pick<ReverbSettings, 'wet' | 'decay' | 'preDelay' | 'roomSize'>
> = {
  'small-room': { wet: 0.15, decay: 0.6, preDelay: 0.005, roomSize: 0.2 },
  'medium-room': { wet: 0.28, decay: 1.5, preDelay: 0.01, roomSize: 0.45 },
  'large-hall': { wet: 0.4, decay: 3.2, preDelay: 0.02, roomSize: 0.7 },
  cathedral: { wet: 0.55, decay: 6, preDelay: 0.04, roomSize: 0.95 },
  studio: { wet: 0.2, decay: 1, preDelay: 0.008, roomSize: 0.3 },
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  volume: 0.8,
  visualizerMode: 'bars',
  songsFolder: 'public/songs',
  effects: {
    equalizer: {
      enabled: false,
      band60: 0,
      band170: 0,
      band350: 0,
      band1k: 0,
      band3_5k: 0,
      band10k: 0,
    },
    reverb: {
      enabled: false,
      preset: 'medium-room',
      ...REVERB_PRESETS['medium-room'],
    },
    bassBoost: {
      enabled: false,
      amount: 50,
    },
  },
};

export const SETTINGS_SINGLETON_ID = 'app-settings';
