import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  Playlist,
  SETTINGS_SINGLETON_ID,
  Song,
  SongBlobRecord,
} from '../../shared/models';

interface SettingsRecord extends AppSettings {
  id: string;
}

/**
 * Centralized persistence layer backed by IndexedDB (Dexie).
 * Stores song metadata, raw audio blobs, playlists and user settings.
 * Nothing is ever uploaded — everything stays on the device.
 */
@Injectable({ providedIn: 'root' })
export class StorageService extends Dexie {
  private readonly songs!: Table<Song, string>;
  private readonly blobs!: Table<SongBlobRecord, string>;
  private readonly playlists!: Table<Playlist, string>;
  private readonly settings!: Table<SettingsRecord, string>;

  constructor() {
    super('music-app-db');
    this.version(1).stores({
      songs: 'id, title, artist, album, genre, addedDate',
      blobs: 'id',
      playlists: 'id, name, updatedDate',
      settings: 'id',
    });
  }

  // ---- Songs ----------------------------------------------------------------

  async getAllSongs(): Promise<Song[]> {
    return this.songs.orderBy('addedDate').reverse().toArray();
  }

  async putSong(song: Song, blob?: Blob): Promise<void> {
    await this.transaction('rw', this.songs, this.blobs, async () => {
      await this.songs.put(song);
      if (blob) {
        await this.blobs.put({ id: song.id, blob });
      }
    });
  }

  async getSongBlob(id: string): Promise<Blob | undefined> {
    return (await this.blobs.get(id))?.blob;
  }

  async deleteSong(id: string): Promise<void> {
    await this.transaction('rw', this.songs, this.blobs, async () => {
      await this.songs.delete(id);
      await this.blobs.delete(id);
    });
  }

  // ---- Playlists ------------------------------------------------------------

  async getAllPlaylists(): Promise<Playlist[]> {
    return this.playlists.orderBy('updatedDate').reverse().toArray();
  }

  async putPlaylist(playlist: Playlist): Promise<void> {
    await this.playlists.put(playlist);
  }

  async deletePlaylist(id: string): Promise<void> {
    await this.playlists.delete(id);
  }

  // ---- Settings -------------------------------------------------------------

  async getSettings(): Promise<AppSettings> {
    const record = await this.settings.get(SETTINGS_SINGLETON_ID);
    if (!record) {
      return structuredClone(DEFAULT_SETTINGS);
    }
    const { id: _id, ...settings } = record;
    return settings;
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.settings.put({ ...settings, id: SETTINGS_SINGLETON_ID });
  }
}
