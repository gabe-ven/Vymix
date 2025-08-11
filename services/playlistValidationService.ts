import { PlaylistData, SpotifyTrack, PlaylistInfo } from './types/playlistTypes';

export class PlaylistValidationService {
  /**
   * Validates playlist generation inputs
   */
  validatePlaylistInputs(emojis: string[], songCount: number, vibe: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate emojis
    if (!emojis || emojis.length === 0) {
      errors.push('At least one emoji is required');
    } else if (emojis.length > 10) {
      errors.push('Maximum 10 emojis allowed');
    }

    // Validate song count
    if (!songCount || songCount < 1) {
      errors.push('Song count must be at least 1');
    } else if (songCount > 50) {
      errors.push('Maximum 50 songs allowed');
    }

    // Validate vibe
    if (!vibe || vibe.trim().length === 0) {
      errors.push('Vibe description is required');
    } else if (vibe.trim().length > 200) {
      errors.push('Vibe description must be 200 characters or less');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates playlist data structure
   */
  validatePlaylistData(playlist: PlaylistData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!playlist.name || playlist.name.trim().length === 0) {
      errors.push('Playlist name is required');
    }

    if (!playlist.description || playlist.description.trim().length === 0) {
      errors.push('Playlist description is required');
    }

    if (!playlist.emojis || playlist.emojis.length === 0) {
      errors.push('At least one emoji is required');
    }

    if (!playlist.vibe || playlist.vibe.trim().length === 0) {
      errors.push('Vibe description is required');
    }

    if (!playlist.tracks || playlist.tracks.length === 0) {
      errors.push('At least one track is required');
    }

    // Validate color palette
    if (!playlist.colorPalette || playlist.colorPalette.length === 0) {
      errors.push('Color palette is required');
    } else {
      playlist.colorPalette.forEach((color, index) => {
        if (!this.isValidHexColor(color)) {
          errors.push(`Invalid hex color at index ${index}: ${color}`);
        }
      });
    }

    // Validate keywords
    if (playlist.keywords && playlist.keywords.length > 20) {
      errors.push('Maximum 20 keywords allowed');
    }

    // Validate tracks
    if (playlist.tracks) {
      playlist.tracks.forEach((track, index) => {
        const trackErrors = this.validateTrack(track, index);
        errors.push(...trackErrors);
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates individual track data
   */
  validateTrack(track: SpotifyTrack, index: number): string[] {
    const errors: string[] = [];

    if (!track.id || track.id.trim().length === 0) {
      errors.push(`Track ${index}: Missing track ID`);
    }

    if (!track.name || track.name.trim().length === 0) {
      errors.push(`Track ${index}: Missing track name`);
    }

    if (!track.artists || track.artists.length === 0) {
      errors.push(`Track ${index}: At least one artist is required`);
    }

    if (!track.album || !track.album.name) {
      errors.push(`Track ${index}: Missing album information`);
    }

    if (!track.uri || track.uri.trim().length === 0) {
      errors.push(`Track ${index}: Missing track URI`);
    }

    if (track.duration_ms <= 0) {
      errors.push(`Track ${index}: Invalid duration`);
    }

    return errors;
  }

  /**
   * Validates playlist info structure
   */
  validatePlaylistInfo(info: PlaylistInfo): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!info.name || info.name.trim().length === 0) {
      errors.push('Playlist name is required');
    }

    if (!info.description || info.description.trim().length === 0) {
      errors.push('Playlist description is required');
    }

    if (!info.colorPalette || info.colorPalette.length === 0) {
      errors.push('Color palette is required');
    } else {
      info.colorPalette.forEach((color, index) => {
        if (!this.isValidHexColor(color)) {
          errors.push(`Invalid hex color at index ${index}: ${color}`);
        }
      });
    }

    if (info.keywords && info.keywords.length > 20) {
      errors.push('Maximum 20 keywords allowed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitizes playlist inputs
   */
  sanitizePlaylistInputs(emojis: string[], songCount: number, vibe: string): { emojis: string[]; songCount: number; vibe: string } {
    return {
      emojis: emojis.filter(emoji => emoji && emoji.trim().length > 0).slice(0, 10),
      songCount: Math.max(1, Math.min(50, Math.floor(songCount))),
      vibe: vibe.trim().substring(0, 200)
    };
  }

  /**
   * Sanitizes playlist data
   */
  sanitizePlaylistData(playlist: PlaylistData): PlaylistData {
    return {
      ...playlist,
      name: playlist.name?.trim() || 'Untitled Playlist',
      description: playlist.description?.trim() || 'A carefully curated musical journey',
      emojis: playlist.emojis?.filter(emoji => emoji && emoji.trim().length > 0) || [],
      vibe: playlist.vibe?.trim() || 'vibes',
      keywords: playlist.keywords?.filter(keyword => keyword && keyword.trim().length > 0).slice(0, 20) || [],
      colorPalette: playlist.colorPalette?.filter(color => this.isValidHexColor(color)) || ['#6366f1', '#8b5cf6', '#a855f7'],
      tracks: playlist.tracks?.filter(track => this.isValidTrack(track)) || [],
      songCount: playlist.tracks?.filter(track => this.isValidTrack(track)).length || 0
    };
  }

  /**
   * Checks if a hex color is valid
   */
  private isValidHexColor(color: string): boolean {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
  }

  /**
   * Checks if a track is valid
   */
  private isValidTrack(track: SpotifyTrack): boolean {
    return !!(track && track.id && track.name && track.artists && track.artists.length > 0);
  }

  /**
   * Validates user ID format
   */
  validateUserId(userId: string): { isValid: boolean; error?: string } {
    if (!userId || userId.trim().length === 0) {
      return { isValid: false, error: 'User ID is required' };
    }

    if (userId.length < 10 || userId.length > 100) {
      return { isValid: false, error: 'User ID must be between 10 and 100 characters' };
    }

    return { isValid: true };
  }

  /**
   * Validates playlist ID format
   */
  validatePlaylistId(playlistId: string): { isValid: boolean; error?: string } {
    if (!playlistId || playlistId.trim().length === 0) {
      return { isValid: false, error: 'Playlist ID is required' };
    }

    if (playlistId.length < 10 || playlistId.length > 100) {
      return { isValid: false, error: 'Playlist ID must be between 10 and 100 characters' };
    }

    return { isValid: true };
  }
}

export const playlistValidationService = new PlaylistValidationService(); 