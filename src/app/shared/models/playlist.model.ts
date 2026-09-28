/** A user-created ordered collection of songs. */
export interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  createdDate: number;
  updatedDate: number;
}
