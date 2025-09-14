// This file has been refactored into smaller, focused services:
// - playlistGenerationService.ts: AI playlist generation logic
// - playlistManagementService.ts: CRUD operations for playlists
// - playlistValidationService.ts: Input validation and sanitization
// - playlistExportService.ts: Export/import functionality

// Import the new services
import { playlistGenerationService } from './playlistGenerationService';
import { playlistManagementService } from './playlistManagementService';
import { playlistValidationService } from './playlistValidationService';
import { playlistExportService } from './playlistExportService';

// Re-export the new services for backward compatibility
export { playlistGenerationService } from './playlistGenerationService';
export { playlistManagementService } from './playlistManagementService';
export { playlistValidationService } from './playlistValidationService';
export { playlistExportService } from './playlistExportService';

// Re-export the management functions for backward compatibility
export {
  savePlaylistToFirestore,
  getUserPlaylists,
  deletePlaylist,
  forceDeletePlaylist,
  testFirestoreConnection,
} from './playlistManagementService';

// Legacy class for backward compatibility - delegates to new services
export class PlaylistService {
  async generatePlaylist(emojis: string[], songCount: number, vibe: string) {
    return playlistGenerationService.generatePlaylist(emojis, songCount, vibe);
  }

  async generatePlaylistStreaming(
    emojis: string[],
    songCount: number,
    vibe: string,
    onProgress?: (playlist: any, progress: any) => void,
    bypassCache?: boolean
  ) {
    return playlistGenerationService.generatePlaylist(emojis, songCount, vibe, {
      streaming: true,
      onProgress,
      bypassCache,
    });
  }

  async regeneratePlaylist(
    emojis: string[],
    songCount: number,
    vibe: string,
    onProgress?: (playlist: any, progress: any) => void
  ) {
    return playlistGenerationService.generatePlaylist(emojis, songCount, vibe, {
      streaming: true,
      onProgress,
      bypassCache: true,
    });
  }

  async saveToSpotify(playlistData: any, userId?: string) {
    return playlistManagementService.saveToSpotify(playlistData, userId);
  }
}

// Create and export a default instance for backward compatibility
export const playlistService = new PlaylistService();

// Re-export types for backward compatibility
export * from './types/playlistTypes';
