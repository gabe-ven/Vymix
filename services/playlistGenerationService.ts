import { OPENAI_API_KEY } from '../env';
import { spotifyService } from './spotify';
import { 
  PlaylistData, 
  SpotifyTrack, 
  PlaylistProgress, 
  PlaylistInfo
} from './types/playlistTypes';

export class PlaylistGenerationService {
  private playlistCache = new Map<string, {playlist: PlaylistData, timestamp: number}>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Main playlist generation method with optional streaming support
   */
  async generatePlaylist(
    emojis: string[],
    songCount: number,
    vibe: string,
    options: {
      streaming?: boolean;
      onProgress?: (playlist: Partial<PlaylistData>, progress: PlaylistProgress) => void;
    } = {}
  ): Promise<PlaylistData> {
    console.log('🎵 Generating playlist:', { emojis, vibe, songCount, streaming: options.streaming });
    
    // Check cache first
    const cached = this.getCachedPlaylist(emojis, songCount, vibe);
    if (cached) {
      if (options.onProgress) {
        options.onProgress(cached, { current: songCount, total: songCount, phase: 'Using cached playlist' });
      }
      return cached;
    }
    
    const startTime = Date.now();
    const playlist = await this._generatePlaylist(emojis, songCount, vibe, options);
    const totalTime = Date.now() - startTime;
    
    console.log(`🎉 Playlist generated in ${totalTime}ms`);
    
    // Cache the result
    this.cachePlaylist(emojis, songCount, vibe, playlist);
    
    return playlist;
  }

  /**
   * Generate multiple playlists in parallel
   */
  async generateMultiplePlaylists(
    playlists: Array<{emojis: string[], songCount: number, vibe: string}>,
    onProgress?: (playlist: Partial<PlaylistData>, progress: PlaylistProgress) => void
  ): Promise<PlaylistData[]> {
    console.log(`🚀 Generating ${playlists.length} playlists in parallel...`);
    
    const startTime = Date.now();
    
    const playlistPromises = playlists.map(async (playlist, index) => {
      try {
        console.log(`🎵 Starting playlist ${index + 1}/${playlists.length}`);
        const result = await this.generatePlaylist(
          playlist.emojis,
          playlist.songCount,
          playlist.vibe,
          {
            streaming: true,
            onProgress: (partialPlaylist, progress) => {
              onProgress?.(partialPlaylist, {
                ...progress,
                phase: `Playlist ${index + 1}: ${progress.phase}`
              });
            }
          }
        );
        console.log(`✅ Playlist ${index + 1} completed`);
        return result;
      } catch (error) {
        console.error(`❌ Failed to generate playlist ${index + 1}:`, error);
        throw error;
      }
    });
    
    const results = await Promise.all(playlistPromises);
    const totalTime = Date.now() - startTime;
    
    console.log(`🎉 All ${playlists.length} playlists generated in ${totalTime}ms`);
    return results;
  }

  /**
   * Core playlist generation logic
   */
  private async _generatePlaylist(
    emojis: string[],
    songCount: number,
    vibe: string,
    options: { streaming?: boolean; onProgress?: (playlist: Partial<PlaylistData>, progress: PlaylistProgress) => void }
  ): Promise<PlaylistData> {
    try {
      // Check Spotify availability
      const spotifyWorking = await this.testSpotifyService();
      if (!spotifyWorking) {
        throw new Error('Spotify service is not available. Please check your connection and authentication.');
      }

      // Generate playlist info
      options.onProgress?.({ emojis, songCount, vibe }, { current: 0, total: songCount, phase: 'Generating playlist info...' });
      const playlistInfo = await this.generatePlaylistInfo(emojis, vibe);
      
             // Generate cover image
       options.onProgress?.({ emojis, songCount, vibe, ...playlistInfo }, { current: 1, total: songCount, phase: 'Generating cover image...' });
       const coverImageUrl = await this.generateCoverImage(emojis, vibe, playlistInfo.colorPalette);
       
       // Generate tracks
       options.onProgress?.({ emojis, songCount, vibe, ...playlistInfo, coverImageUrl }, { current: 2, total: songCount, phase: 'Generating tracks...' });
      const tracks = await this.generateTracks(emojis, songCount, vibe, playlistInfo.keywords, options);
      
      // Validate and finalize
      const finalTracks = this.validatePlaylist(tracks, songCount);
      
                   const playlist: PlaylistData = {
        id: this.generatePlaylistId(emojis, vibe, songCount),
         emojis,
         songCount,
         vibe,
        name: playlistInfo.name,
        description: playlistInfo.description,
        coverImageUrl,
         colorPalette: playlistInfo.colorPalette,
         tracks: finalTracks,
        createdAt: new Date(),
         keywords: playlistInfo.keywords
      };

      console.log('🎉 Final generated playlist:', {
        name: playlist.name,
        description: playlist.description,
        coverImageUrl: playlist.coverImageUrl,
        colorPalette: playlist.colorPalette,
        trackCount: playlist.tracks.length
      });

      options.onProgress?.(playlist, { current: songCount, total: songCount, phase: 'Playlist ready!' });
      
      return playlist;
      
    } catch (error) {
      console.error('❌ Playlist generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate playlist metadata using AI
   */
  private async generatePlaylistInfo(emojis: string[], vibe: string): Promise<PlaylistInfo> {
    const emojiString = emojis.join(' ');
    const prompt = `Create a playlist based on these emojis: ${emojiString} and vibe: "${vibe}".

Please provide:
1. A catchy title (max 50 characters)
2. A brief description (max 200 characters) 
3. 5-8 relevant keywords for music search
4. A color palette with 4-6 hex colors that match the mood

Format as JSON:
{
  "title": "title here",
  "description": "description here", 
  "keywords": ["keyword1", "keyword2"],
  "colorPalette": ["#hex1", "#hex2"]
}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      console.log('🔍 AI Response content:', content);
      
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ No JSON found in AI response, using fallback');
        throw new Error('No valid JSON found in OpenAI response');
      }

      console.log('🔍 Extracted JSON:', jsonMatch[0]);
      
      const playlistInfo = JSON.parse(jsonMatch[0]);
      console.log('🔍 Parsed playlist info:', playlistInfo);
      
      return {
        name: playlistInfo.title || playlistInfo.name || `Playlist ${emojis.join('')}`,
        description: playlistInfo.description || `A ${vibe} playlist`,
        keywords: playlistInfo.keywords || [vibe, ...emojis],
        colorPalette: playlistInfo.colorPalette || ['#1DB954', '#191414', '#1ED760', '#535353']
      };
      
    } catch (error) {
      console.warn('Failed to generate playlist info with AI, using fallback:', error);
             return {
         name: `Playlist ${emojis.join('')}`,
         description: `A ${vibe} playlist`,
         keywords: [vibe, ...emojis],
         colorPalette: ['#1DB954', '#191414', '#1ED760', '#535353']
       };
    }
  }

  /**
   * Generate cover image using AI
   */
  private async generateCoverImage(emojis: string[], vibe: string, colorPalette: string[]): Promise<string> {
    const emojiString = emojis.join(' ');
    const colorString = colorPalette.join(', ');
    
    const prompt = `Create a vibrant, modern album cover for a music playlist. 
    
Theme: ${emojiString} - ${vibe}
Colors: ${colorString}
Style: Modern, minimalist, music-focused, high contrast, suitable for mobile apps

The image should be abstract and artistic, representing the musical mood and energy.`;

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        }),
      });

      if (!response.ok) {
        throw new Error(`DALL-E API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('🖼️ DALL-E response:', data);
      const imageUrl = data.data?.[0]?.url || '';
      console.log('🖼️ Generated image URL:', imageUrl);
      return imageUrl;
      
    } catch (error) {
      console.warn('Failed to generate cover image, using fallback:', error);
      // Return a fallback image or empty string
      return '';
    }
  }

  /**
   * Generate tracks using AI and Spotify search
   */
  private async generateTracks(
    emojis: string[], 
    songCount: number, 
    vibe: string, 
    keywords: string[],
    options: { streaming?: boolean; onProgress?: (playlist: Partial<PlaylistData>, progress: PlaylistProgress) => void }
  ): Promise<SpotifyTrack[]> {
    console.log('🎵 Generating tracks:', { emojis, vibe, songCount, keywords });
    
    const usedTrackIds = new Set<string>();
    const tracks: SpotifyTrack[] = [];
    const seed = this.generatePlaylistSeed(emojis, vibe, songCount);
    
    // Generate song suggestions with AI
    const songSuggestions = await this.generateSongSuggestions(emojis, vibe, songCount, keywords, seed);
    
    if (options.onProgress) {
      options.onProgress({ tracks: [] }, { current: 0, total: songCount, phase: 'Searching for tracks...' });
    }

    // Search for tracks based on AI suggestions
    for (let i = 0; i < songSuggestions.length && tracks.length < songCount; i++) {
      const suggestion = songSuggestions[i];
      const track = await this.searchTrack(suggestion.title, suggestion.artist, usedTrackIds);
      
      if (track) {
        tracks.push(track);
        usedTrackIds.add(track.id);
        
        if (options.onProgress) {
          options.onProgress({ tracks }, { current: tracks.length, total: songCount, phase: `Found ${tracks.length}/${songCount} tracks` });
        }
      }
    }

    // Fill remaining slots with similar tracks
    if (tracks.length < songCount) {
      const remaining = songCount - tracks.length;
      const additionalTracks = await this.generateAdditionalTracks(emojis, vibe, keywords, remaining, usedTrackIds, options);
      tracks.push(...additionalTracks);
    }

    return tracks;
  }

  /**
   * Generate song suggestions using AI
   */
  private async generateSongSuggestions(
    emojis: string[], 
    vibe: string, 
    songCount: number, 
    keywords: string[], 
    seed: string
  ): Promise<Array<{title: string, artist: string}>> {
    const emojiString = emojis.join(' ');
    const keywordString = keywords.join(', ');
    
    const prompt = `Suggest ${songCount} specific songs for a music playlist.

Emojis: ${emojiString}
Vibe: ${vibe}
Keywords: ${keywordString}
Seed: ${seed}

Provide songs that match the mood and style. Format as JSON array:
[
  {"title": "Song Title", "artist": "Artist Name"},
  {"title": "Song Title 2", "artist": "Artist Name 2"}
]

Focus on popular, recognizable songs that are likely to be on Spotify.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in OpenAI response');
      }

      return JSON.parse(jsonMatch[0]);
      
    } catch (error) {
      console.warn('Failed to generate song suggestions with AI, using fallback:', error);
      // Return fallback suggestions based on keywords
      return keywords.slice(0, songCount).map(keyword => ({
        title: keyword,
        artist: 'Various Artists'
      }));
    }
  }

  /**
   * Search for a specific track on Spotify
   */
  private async searchTrack(title: string, artist: string, usedTrackIds: Set<string>): Promise<SpotifyTrack | null> {
    const query = `${title} ${artist}`.trim();
    
    try {
      const searchResponse = await spotifyService.search(query, ['track'], 10, 0);
      
      if (searchResponse.tracks.items.length === 0) {
        return null;
      }

      // Find first unused track
      for (const track of searchResponse.tracks.items) {
        if (!usedTrackIds.has(track.id)) {
          return track;
        }
      }

      return null;
      
    } catch (error) {
      console.warn(`Search failed for "${query}":`, error);
      return null;
    }
  }

  /**
   * Generate additional tracks to fill the playlist
   */
  private async generateAdditionalTracks(
    emojis: string[],
    vibe: string,
    keywords: string[],
    count: number,
    usedTrackIds: Set<string>,
    options: { streaming?: boolean; onProgress?: (playlist: Partial<PlaylistData>, progress: PlaylistProgress) => void }
  ): Promise<SpotifyTrack[]> {
    const tracks: SpotifyTrack[] = [];
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];
    
    try {
      const searchResponse = await spotifyService.search(keyword, ['track'], count * 2, 0);
      
      for (const track of searchResponse.tracks.items) {
        if (tracks.length >= count) break;
        if (!usedTrackIds.has(track.id)) {
          tracks.push(track);
          usedTrackIds.add(track.id);
        }
      }
      
    } catch (error) {
      console.warn('Failed to generate additional tracks:', error);
    }
    
    return tracks;
  }

  /**
   * Generate a unique seed for playlist generation
   */
  private generatePlaylistSeed(emojis: string[], vibe: string, songCount: number): string {
    const combined = `${emojis.join('')}-${vibe}-${songCount}-${Date.now()}`;
    return this.hashString(combined);
  }

  /**
   * Simple hash function for generating seeds
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Test if Spotify service is working
   */
  private async testSpotifyService(): Promise<boolean> {
    try {
      await spotifyService.getCurrentUser();
      return true;
    } catch (error) {
      console.warn('Spotify service test failed:', error);
      return false;
    }
  }

  /**
   * Generate a unique playlist ID
   */
  private generatePlaylistId(emojis: string[], vibe: string, songCount: number): string {
    const combined = `${emojis.join('')}-${vibe}-${songCount}`;
    return this.hashString(combined);
  }

  /**
   * Validate and clean up the final playlist
   */
  private validatePlaylist(tracks: SpotifyTrack[], songCount: number): SpotifyTrack[] {
    // Remove duplicates
    const uniqueTracks = tracks.filter((track, index, self) => 
      index === self.findIndex(t => t.id === track.id)
    );

    // Ensure we have the right number of tracks
    if (uniqueTracks.length > songCount) {
      return uniqueTracks.slice(0, songCount);
    }

    return uniqueTracks;
  }

  /**
   * Cache management methods
   */
  private generateCacheKey(emojis: string[], songCount: number, vibe: string): string {
    return `${emojis.join('')}-${songCount}-${vibe}`;
  }

  private getCachedPlaylist(emojis: string[], songCount: number, vibe: string): PlaylistData | null {
    const key = this.generateCacheKey(emojis, songCount, vibe);
    const cached = this.playlistCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('🎯 Using cached playlist');
      return cached.playlist;
    }
    
    return null;
  }

  private cachePlaylist(emojis: string[], songCount: number, vibe: string, playlist: PlaylistData): void {
    const key = this.generateCacheKey(emojis, songCount, vibe);
    this.playlistCache.set(key, { playlist, timestamp: Date.now() });
    
    // Clean up old cache entries
    if (this.playlistCache.size > 100) {
      const oldestKey = this.playlistCache.keys().next().value;
      if (oldestKey) {
        this.playlistCache.delete(oldestKey);
      }
    }
  }
}

export const playlistGenerationService = new PlaylistGenerationService(); 