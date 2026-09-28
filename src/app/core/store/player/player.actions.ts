import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { RepeatMode, Song } from '../../../shared/models';

export const PlayerActions = createActionGroup({
  source: 'Player',
  events: {
    /** Start playing a song. When `queue` is provided it replaces the queue. */
    'Play Song': props<{ song: Song; queue?: string[] }>(),
    'Set Queue': props<{ songIds: string[] }>(),

    Play: emptyProps(),
    Pause: emptyProps(),
    'Toggle Play': emptyProps(),
    Stop: emptyProps(),
    Next: props<{ auto: boolean }>(),
    Previous: emptyProps(),

    'Toggle Shuffle': emptyProps(),
    'Cycle Repeat': emptyProps(),
    'Set Repeat Mode': props<{ mode: RepeatMode }>(),

    'Track Ended': emptyProps(),
    'Status Changed': props<{ playing: boolean }>(),
  },
});
