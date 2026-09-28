import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Playlist } from '../../../shared/models';

export const PlaylistActions = createActionGroup({
  source: 'Playlist',
  events: {
    'Load Playlists': emptyProps(),
    'Load Playlists Success': props<{ playlists: Playlist[] }>(),

    'Create Playlist': props<{ name: string }>(),
    'Rename Playlist': props<{ id: string; name: string }>(),
    'Delete Playlist': props<{ id: string }>(),

    'Add Song To Playlist': props<{ playlistId: string; songId: string }>(),
    'Remove Song From Playlist': props<{ playlistId: string; songId: string }>(),
    'Reorder Playlist Songs': props<{ playlistId: string; songIds: string[] }>(),

    'Playlist Upserted': props<{ playlist: Playlist }>(),
    'Playlist Removed': props<{ id: string }>(),
  },
});
