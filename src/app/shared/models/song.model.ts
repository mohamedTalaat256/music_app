/**
 * Normalized representation of an audio track in the library.
 * Metadata is extracted with music-metadata-browser and persisted in IndexedDB.
 */
export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: number | null;
  duration: number; // seconds
  artwork: string | null; // object URL or data URL for album art
  fileName: string;
  fileType: string;
  fileSize: number;
  /**
   * Playable URL. For imported files this is an object URL created at runtime.
   * For assets shipped in /public/songs it is a static path.
   */
  url: string;
  /** Original file path/source used to recreate the object URL after reload. */
  source: SongSource;
  addedDate: number; // epoch ms
}

export type SongSource =
  | { kind: 'asset'; path: string }
  | { kind: 'imported' };

/** Blob record kept separately so playable data survives reloads. */
export interface SongBlobRecord {
  id: string;
  blob: Blob;
}

export const SUPPORTED_AUDIO_EXTENSIONS = [
  'mp3',
  'wav',
  'ogg',
  'aac',
  'flac',
  'm4a',
] as const;

export type SupportedAudioExtension =
  (typeof SUPPORTED_AUDIO_EXTENSIONS)[number];

export function isSupportedAudioFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return (SUPPORTED_AUDIO_EXTENSIONS as readonly string[]).includes(ext);
}
