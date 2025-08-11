// Playlist Types and Interfaces
export interface PlaylistData {
  id: string; // Make ID required since we always generate it
  name: string;
  description: string;
  colorPalette: string[];
  keywords: string[];
  coverImageUrl?: string;
  emojis: string[];
  songCount: number;
  vibe: string;
  tracks: SpotifyTrack[];
  spotifyUrl?: string;
  isSpotifyPlaylist?: boolean;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  uri: string;
  external_urls: { spotify: string };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images?: SpotifyImage[];
  external_urls: { spotify: string };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  external_urls: { spotify: string };
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface PlaylistProgress {
  current: number;
  total: number;
  phase: string;
}

export interface PlaylistInfo {
  name: string;
  description: string;
  colorPalette: string[];
  keywords: string[];
}

export interface SongSuggestion {
  title: string;
  artist: string;
} 