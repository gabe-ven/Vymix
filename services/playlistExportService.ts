import { playlistValidationService } from './playlistValidationService';
import { PlaylistData, SpotifyTrack } from './types/playlistTypes';

// Interface for export data (without internal IDs)
export interface ExportPlaylistData extends Omit<PlaylistData, 'id' | 'userId'> {
  id?: string; // Optional for export
  userId?: string; // Optional for export
}

export interface ExportFormat {
  version: string;
  exportDate: string;
  playlist: ExportPlaylistData;
}

export interface ImportResult {
  success: boolean;
  playlist?: PlaylistData;
  errors?: string[];
  warnings?: string[];
}

export class PlaylistExportService {
  private readonly EXPORT_VERSION = '1.0.0';

  /**
   * Exports playlist to JSON format
   */
  exportToJSON(playlist: PlaylistData): string {
    try {
      // Validate playlist before export
      const validation = playlistValidationService.validatePlaylistData(playlist);
      if (!validation.isValid) {
        throw new Error(`Playlist validation failed: ${validation.errors.join(', ')}`);
      }

      const exportData: ExportFormat = {
        version: this.EXPORT_VERSION,
        exportDate: new Date().toISOString(),
        playlist: this.sanitizeForExport(playlist)
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Export to JSON failed:', error);
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Exports playlist to CSV format
   */
  exportToCSV(playlist: PlaylistData): string {
    try {
      // Validate playlist before export
      const validation = playlistValidationService.validatePlaylistData(playlist);
      if (!validation.isValid) {
        throw new Error(`Playlist validation failed: ${validation.errors.join(', ')}`);
      }

      const sanitizedPlaylist = this.sanitizeForExport(playlist);
      
      // Create CSV header
      const headers = [
        'Track Name',
        'Artist(s)',
        'Album',
        'Duration (ms)',
        'Spotify URI',
        'Spotify URL'
      ];

      // Create CSV rows
      const rows = sanitizedPlaylist.tracks.map(track => [
        this.escapeCSV(track.name),
        this.escapeCSV(track.artists.map(artist => artist.name).join(', ')),
        this.escapeCSV(track.album.name),
        track.duration_ms.toString(),
        track.uri,
        track.external_urls.spotify
      ]);

      // Combine header and rows
      const csvContent = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Export to CSV failed:', error);
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Exports playlist to plain text format
   */
  exportToText(playlist: PlaylistData): string {
    try {
      // Validate playlist before export
      const validation = playlistValidationService.validatePlaylistData(playlist);
      if (!validation.isValid) {
        throw new Error(`Playlist validation failed: ${validation.errors.join(', ')}`);
      }

      const sanitizedPlaylist = this.sanitizeForExport(playlist);
      
      let textContent = '';
      textContent += `Playlist: ${sanitizedPlaylist.name}\n`;
      textContent += `Description: ${sanitizedPlaylist.description}\n`;
      textContent += `Vibe: ${sanitizedPlaylist.vibe}\n`;
      textContent += `Emojis: ${sanitizedPlaylist.emojis.join(' ')}\n`;
      textContent += `Songs: ${sanitizedPlaylist.songCount}\n`;
      textContent += `Created: ${sanitizedPlaylist.createdAt?.toLocaleDateString() || 'Unknown'}\n\n`;
      
      textContent += 'Tracks:\n';
      textContent += '='.repeat(50) + '\n\n';
      
      sanitizedPlaylist.tracks.forEach((track, index) => {
        textContent += `${index + 1}. ${track.name}\n`;
        textContent += `   Artist: ${track.artists.map(artist => artist.name).join(', ')}\n`;
        textContent += `   Album: ${track.album.name}\n`;
        textContent += `   Duration: ${this.formatDuration(track.duration_ms)}\n`;
        textContent += `   Spotify: ${track.external_urls.spotify}\n\n`;
      });

      return textContent;
    } catch (error) {
      console.error('Export to text failed:', error);
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Imports playlist from JSON format
   */
  importFromJSON(jsonString: string): ImportResult {
    try {
      const parsed = JSON.parse(jsonString);
      
      if (!parsed || typeof parsed !== 'object') {
        return {
          success: false,
          errors: ['Invalid JSON format']
        };
      }

      // Check if it's our export format
      if (parsed.version && parsed.playlist) {
        return this.validateAndImport(parsed.playlist);
      }

      // Check if it's a direct playlist object
      if (parsed.name && parsed.tracks) {
        return this.validateAndImport(parsed);
      }

      return {
        success: false,
        errors: ['Unsupported format: missing playlist data']
      };

    } catch (error) {
      return {
        success: false,
        errors: [`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Imports playlist from CSV format
   */
  importFromCSV(csvString: string): ImportResult {
    try {
      const lines = csvString.trim().split('\n');
      if (lines.length < 2) {
        return {
          success: false,
          errors: ['CSV must have at least a header and one data row']
        };
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const requiredHeaders = ['Track Name', 'Artist(s)', 'Album', 'Duration (ms)', 'Spotify URI'];
      
      const missingHeaders = requiredHeaders.filter(header => 
        !headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
      );

      if (missingHeaders.length > 0) {
        return {
          success: false,
          errors: [`Missing required headers: ${missingHeaders.join(', ')}`]
        };
      }

      const tracks: SpotifyTrack[] = [];
      const warnings: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = this.parseCSVLine(line);
        if (values.length < 5) {
          warnings.push(`Skipping invalid row ${i + 1}: insufficient data`);
          continue;
        }

        try {
          const track: SpotifyTrack = {
            id: `imported-${Date.now()}-${i}`,
            name: values[0] || 'Unknown Track',
            artists: [{ 
              id: `imported-artist-${i}`, 
              name: values[1] || 'Unknown Artist',
              external_urls: { spotify: '' }
            }],
            album: {
              id: `imported-album-${i}`,
              name: values[2] || 'Unknown Album',
              images: [],
              external_urls: { spotify: '' }
            },
            duration_ms: parseInt(values[3]) || 0,
            uri: values[4] || '',
            external_urls: { spotify: values[5] || '' }
          };

          tracks.push(track);
        } catch (error) {
          warnings.push(`Skipping row ${i + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`);
        }
      }

      if (tracks.length === 0) {
        return {
          success: false,
          errors: ['No valid tracks found in CSV']
        };
      }

      const playlist: PlaylistData = {
        id: `imported-${Date.now()}`, // Generate unique ID for imported playlist
        name: 'Imported Playlist',
        description: 'Playlist imported from CSV',
        colorPalette: ['#6366f1', '#8b5cf6', '#a855f7'],
        keywords: [],
        emojis: ['📱'],
        songCount: tracks.length,
        vibe: 'imported',
        tracks,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return {
        success: true,
        playlist,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      return {
        success: false,
        errors: [`CSV import failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Gets supported export formats
   */
  getSupportedFormats(): string[] {
    return ['json', 'csv', 'txt'];
  }

  /**
   * Gets export format information
   */
  getFormatInfo(format: string): { name: string; description: string; extension: string } | null {
    const formats: Record<string, { name: string; description: string; extension: string }> = {
      json: {
        name: 'JSON',
        description: 'Complete playlist data in JSON format',
        extension: '.json'
      },
      csv: {
        name: 'CSV',
        description: 'Track list in comma-separated values format',
        extension: '.csv'
      },
      txt: {
        name: 'Text',
        description: 'Human-readable playlist summary',
        extension: '.txt'
      }
    };

    return formats[format.toLowerCase()] || null;
  }

  /**
   * Sanitizes playlist data for export
   */
  private sanitizeForExport(playlist: PlaylistData): ExportPlaylistData {
    return {
      ...playlist,
      id: undefined, // Remove internal ID for export
      userId: undefined, // Remove user ID for export
      createdAt: playlist.createdAt || new Date(),
      updatedAt: playlist.updatedAt || new Date(),
      tracks: playlist.tracks.map(track => ({
        ...track,
        id: track.id || `track-${Date.now()}`,
        artists: track.artists.map(artist => ({
          ...artist,
          id: artist.id || `artist-${Date.now()}`,
          images: artist.images || []
        })),
        album: {
          ...track.album,
          id: track.album.id || `album-${Date.now()}`,
          images: track.album.images || []
        }
      }))
    };
  }

  /**
   * Validates and imports playlist data
   */
  private validateAndImport(playlistData: any): ImportResult {
    try {
      // Basic validation
      if (!playlistData.name || !playlistData.tracks || !Array.isArray(playlistData.tracks)) {
        return {
          success: false,
          errors: ['Invalid playlist data: missing name or tracks']
        };
      }

      // Validate the playlist structure
      const validation = playlistValidationService.validatePlaylistData(playlistData as PlaylistData);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Sanitize the data
      const sanitizedPlaylist = playlistValidationService.sanitizePlaylistData(playlistData as PlaylistData);
      
      // Add import metadata
      const importedPlaylist: PlaylistData = {
        ...sanitizedPlaylist,
        id: `imported-${Date.now()}`, // Generate unique ID for imported playlist
        userId: undefined, // No user ID for imported playlists
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return {
        success: true,
        playlist: importedPlaylist
      };

    } catch (error) {
      return {
        success: false,
        errors: [`Import validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Escapes CSV values
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Parses CSV line with proper handling of quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Formats duration from milliseconds to readable format
   */
  private formatDuration(durationMs: number): string {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

export const playlistExportService = new PlaylistExportService(); 