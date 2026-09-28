import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Song } from '../../../shared/models';

export const LibraryActions = createActionGroup({
  source: 'Library',
  events: {
    'Load Songs': emptyProps(),
    'Load Songs Success': props<{ songs: Song[] }>(),
    'Load Songs Failure': props<{ error: string }>(),

    'Import Files': props<{ files: File[] }>(),
    'Import Assets': props<{ paths: string[] }>(),
    'Import Success': props<{ songs: Song[] }>(),
    'Import Failure': props<{ error: string }>(),

    'Delete Song': props<{ id: string }>(),
    'Song Deleted': props<{ id: string }>(),
  },
});
