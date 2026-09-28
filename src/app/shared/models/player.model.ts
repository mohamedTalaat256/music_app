/** High-level playback status of the audio engine. */
export type PlaybackStatus = 'stopped' | 'playing' | 'paused' | 'loading';

/** Repeat behaviour for the active queue. */
export enum RepeatMode {
  Off = 'off',
  One = 'one',
  All = 'all',
}
