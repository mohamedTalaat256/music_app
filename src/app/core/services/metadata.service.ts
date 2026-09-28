import { Injectable } from '@angular/core';
import { parseBlob } from 'music-metadata-browser';
import { v4 as uuid } from 'uuid';
import { Song } from '../../shared/models';

/**
 * Extracts normalized {@link Song} metadata from raw audio files using
 * music-metadata-browser. Artwork is stored as a data URL so it survives
 * page reloads (object URLs do not).
 */
@Injectable({ providedIn: 'root' })
export class MetadataService {
  /** Parse a user-imported File into a Song plus its backing Blob. */
  async fromFile(file: File): Promise<{ song: Song; blob: Blob }> {
    const url = URL.createObjectURL(file);
    const song = await this.parse(file, file.name, file.type, file.size, url, {
      kind: 'imported',
    });
    return { song, blob: file };
  }

  /** Parse a static asset that ships with the app (e.g. /public/songs). */
  async fromAsset(path: string): Promise<{ song: Song; blob: Blob }> {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load asset: ${path}`);
    }
    const blob = await response.blob();
    const fileName = decodeURIComponent(path.split('/').pop() ?? path);
    // Assets are always reachable by their static path — reuse it as the URL.
    const song = await this.parse(blob, fileName, blob.type, blob.size, path, {
      kind: 'asset',
      path,
    });
    return { song, blob };
  }

  private async parse(
    blob: Blob,
    fileName: string,
    fileType: string,
    fileSize: number,
    url: string,
    source: Song['source'],
  ): Promise<Song> {
    const id = uuid();
    let title = this.stripExtension(fileName);
    let artist = 'Unknown Artist';
    let album = 'Unknown Album';
    let genre = 'Unknown';
    let year: number | null = null;
    let duration = 0;
    let artwork: string | null = null;

    try {
      const metadata = await parseBlob(blob);
      const common = metadata.common;
      if (common.title) title = common.title;
      if (common.artist) artist = common.artist;
      if (common.album) album = common.album;
      if (common.genre?.length) genre = common.genre.join(', ');
      if (common.year) year = common.year;
      if (metadata.format.duration) duration = metadata.format.duration;

      const picture = common.picture?.[0];
      if (picture) {
        const artBlob = new Blob([picture.data as BlobPart], {
          type: picture.format,
        });
        artwork = await this.blobToDataUrl(artBlob);
      }
    } catch {
      // Metadata parsing is best-effort — fall back to filename-derived values.
    }

    return {
      id,
      title,
      artist,
      album,
      genre,
      year,
      duration,
      artwork,
      fileName,
      fileType: fileType || 'audio/mpeg',
      fileSize,
      url,
      source,
      addedDate: Date.now(),
    };
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  private stripExtension(fileName: string): string {
    const dot = fileName.lastIndexOf('.');
    return dot > 0 ? fileName.slice(0, dot) : fileName;
  }
}
