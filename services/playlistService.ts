import { spotifyService } from './spotify';
import { OPENAI_API_KEY } from '../env';

/**
 * Playlist Service - Simplified GPT-4o Approach
 * 
 * This service uses GPT-4o to generate specific song titles and artists based on vibe/emojis,
 * then searches for each song individually via Spotify's search API.
 * 
 * SIMPLIFIED WORKFLOW:
 * 1. Use GPT-4o to generate specific song titles and artists based on vibe/emojis
 * 2. Search for each suggested song individually to get Spotify URIs
 * 3. Return the found tracks (no fallbacks)
 * 
 * Features:
 * - AI-generated song suggestions (real songs by real artists)
 * - Individual track searching
 * - Rate limiting and error handling
 * - Clean, simple approach with no fallbacks
 */

// Types
export interface PlaylistData {
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
  id?: string;
  isSpotifyPlaylist?: boolean;
  uniquenessScore?: number;
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

interface SpotifyArtist {
  id: string;
  name: string;
  images?: SpotifyImage[];
  external_urls: { spotify: string };
}

interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  external_urls: { spotify: string };
}

interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

// Simplified Playlist Service - GPT-4o Powered
class PlaylistService {
  // Helper function to add delay between API calls
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate complete playlist with one function call
  async generatePlaylist(
    emojis: string[],
    songCount: number,
    vibe: string
  ): Promise<PlaylistData> {
    console.log('🎵 Generating playlist:', { emojis, songCount, vibe });

    // Add timeout to prevent hanging - flexible timeout based on song count
    // Account for: OpenAI API calls + DALL-E + multiple Spotify searches + network delays
    const baseTimeout = 120000; // 2 minutes base
    const perSongTimeout = 3000; // 3 seconds per song (accounts for Spotify search + delays)
    const timeoutMs = baseTimeout + (songCount * perSongTimeout);
    
    console.log(`⏱️ Setting timeout to ${timeoutMs / 1000} seconds for ${songCount} songs`);
    
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Playlist generation timeout')), timeoutMs)
    );

    const generationPromise = this._generatePlaylist(emojis, songCount, vibe);

    try {
      return await Promise.race([generationPromise, timeoutPromise]);
    } catch (error) {
      console.error('Playlist generation error:', error);
      
      // Provide user-friendly error message
      const userMessage = this.getSpotifyErrorMessage(error);
      throw new Error(userMessage);
    }
  }

  // Generate playlist with streaming updates
  async generatePlaylistStreaming(
    emojis: string[],
    songCount: number,
    vibe: string,
    onProgress?: (playlist: Partial<PlaylistData>, progress: { current: number; total: number; phase: string }) => void
  ): Promise<PlaylistData> {
    console.log('🎵 Generating playlist with streaming:', { emojis, songCount, vibe });

    // Add timeout to prevent hanging - flexible timeout based on song count
    const baseTimeout = 120000; // 2 minutes base
    const perSongTimeout = 3000; // 3 seconds per song
    const timeoutMs = baseTimeout + (songCount * perSongTimeout);
    
    console.log(`⏱️ Setting timeout to ${timeoutMs / 1000} seconds for ${songCount} songs`);
    
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Playlist generation timeout')), timeoutMs)
    );

    const generationPromise = this._generatePlaylistStreaming(emojis, songCount, vibe, onProgress);

    try {
      return await Promise.race([generationPromise, timeoutPromise]);
    } catch (error) {
      console.error('Playlist generation error:', error);
      
      // Provide user-friendly error message
      const userMessage = this.getSpotifyErrorMessage(error);
      throw new Error(userMessage);
    }
  }

  // Internal playlist generation method
  private async _generatePlaylist(
    emojis: string[],
    songCount: number,
    vibe: string
  ): Promise<PlaylistData> {
    // 1. Generate playlist info first to get the color palette
    const playlistInfo = await this.generatePlaylistInfo(emojis, vibe);
    
    // 2. Generate cover image using the dynamic color palette
    const coverImageUrl = await this.generateCoverImage(emojis, vibe, playlistInfo.colorPalette).catch(() => undefined);

    // 3. Generate tracks using enhanced search-based discovery
    const tracks = await this.generateTracks(emojis, songCount, vibe, playlistInfo.keywords);

    // 4. Calculate uniqueness score
    const uniquenessScore = this.calculatePlaylistUniquenessScore(tracks, vibe, emojis);

    return {
      name: playlistInfo.name,
      description: playlistInfo.description,
      colorPalette: playlistInfo.colorPalette,
      keywords: playlistInfo.keywords,
      coverImageUrl,
      emojis,
      songCount: tracks.length,
      vibe,
      tracks,
      isSpotifyPlaylist: false,
      uniquenessScore,
    };
  }

  // Internal streaming playlist generation method
  private async _generatePlaylistStreaming(
    emojis: string[],
    songCount: number,
    vibe: string,
    onProgress?: (playlist: Partial<PlaylistData>, progress: { current: number; total: number; phase: string }) => void
  ): Promise<PlaylistData> {
    // 1. Generate playlist info first to get the color palette
    onProgress?.({ 
      emojis, 
      songCount, 
      vibe,
      tracks: []
    }, { current: 0, total: songCount, phase: 'Generating playlist info...' });
    
    const playlistInfo = await this.generatePlaylistInfo(emojis, vibe);
    
    // 2. Generate cover image using the dynamic color palette
    onProgress?.({ 
      ...playlistInfo,
      emojis, 
      songCount, 
      vibe,
      tracks: []
    }, { current: 0, total: songCount, phase: 'Creating cover art...' });
    
    const coverImageUrl = await this.generateCoverImage(emojis, vibe, playlistInfo.colorPalette).catch(() => undefined);

    // 3. Generate tracks with streaming updates
    const tracks = await this.generateTracksStreaming(emojis, songCount, vibe, playlistInfo.keywords, onProgress);

    // 4. Calculate uniqueness score
    const uniquenessScore = this.calculatePlaylistUniquenessScore(tracks, vibe, emojis);

    const finalPlaylist = {
      name: playlistInfo.name,
      description: playlistInfo.description,
      colorPalette: playlistInfo.colorPalette,
      keywords: playlistInfo.keywords,
      coverImageUrl,
      emojis,
      songCount: tracks.length,
      vibe,
      tracks,
      isSpotifyPlaylist: false,
      uniquenessScore,
    };

    onProgress?.(finalPlaylist, { current: songCount, total: songCount, phase: 'Complete!' });

    return finalPlaylist;
  }

  // Generate playlist info using OpenAI
  private async generatePlaylistInfo(emojis: string[], vibe: string) {
    const emojiString = emojis.join(' ');
    
    const prompt = `Create a music playlist name, description, and color palette based on:
- These emojis: ${emojiString}
- User's vibe/mood: "${vibe}"

Please respond with a JSON object in this exact format:
{
  "name": "Creative playlist name here",
  "description": "A single compelling sentence that captures the playlist's mood and vibe",
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

The playlist name should be extremely unique, creative, and different from typical playlist names. 
Use one OR two words. It should be lowercase. Avoid generic or common phrases and do NOT use words like "Rage", "Chill", "Vibes", "Energy", "Party", "Focus", "Mood", "Mix", "Playlist", or any other common playlist terms.
Invent a new word, use poetic language, or combine words in an unexpected way. 
Examples of good names: "nightglow", "vaporhaze", "glasswave", "solstice", "dreamtide", "pulsefield", "lumen", "aether", "velvetine", "mistline".

Description guidelines:
- Write a poetic, evocative, and highly original one-line description, all in lowercase.
- Use metaphor, vivid imagery, or surreal language to capture the playlist's mood—avoid literal or generic phrases.
- Make it feel like a whispered secret, a fleeting dream, or a line from a poem.
- No music terms, no genre names, no cliches, no lists, no hashtags, no emojis.
- Keep it under 15 words. And all lowercase.

For the color palette, generate 3 vibrant, contrasting colors in hex format based on the vibe. 
IMPORTANT: Do NOT use black (#000000), white (#FFFFFF), or any very dark (#111111, #222222) or very light (#FEFEFE, #EEEEEE) colors. 
Choose rich, saturated colors that are visually distinct from each other and match the mood.

For the keywords, generate 8-12 specific music-related terms that would help find songs on Spotify. These should be:
- Genre names (e.g., "indie rock", "electronic", "jazz")
- Mood descriptors (e.g., "energetic", "chill", "romantic")
- Tempo indicators (e.g., "upbeat", "slow", "dance")
- Era or style (e.g., "80s", "acoustic", "synthwave")
- Artist types (e.g., "female vocalists", "instrumental")
- Specific musical terms (e.g., "guitar", "piano", "synth", "drums")

Examples: ["indie pop", "energetic", "summer vibes", "guitar", "upbeat", "feel good"] or ["jazz", "chill", "late night", "piano", "smooth", "relaxing"]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    try {
      // Clean up the response content to handle common JSON formatting issues
      let cleanedContent = content.trim();
      
      // Remove any markdown code blocks if present
      cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      
      // Remove any leading/trailing backticks or other characters
      cleanedContent = cleanedContent.replace(/^[`'"]+/, '').replace(/[`'"]+$/, '');
      
      // Try to extract JSON object if it's wrapped in other text
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
      }
      
      console.log('🔍 Attempting to parse playlist info:', cleanedContent.substring(0, 200) + '...');
      
      const parsed = JSON.parse(cleanedContent);
      
      // Validate the parsed object has the expected structure
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid response format - expected object');
      }
      
      const result = {
        name: parsed.name || 'vibes',
        description: parsed.description || 'A carefully curated musical journey.',
        colorPalette: parsed.colorPalette || ['#6366f1', '#8b5cf6', '#a855f7'],
        keywords: parsed.keywords || ['indie', 'atmospheric', 'vibes'],
      };
      
      console.log('✅ Generated playlist info:', { 
        name: result.name, 
        description: result.description.substring(0, 50) + '...',
        colorCount: result.colorPalette.length,
        keywordCount: result.keywords.length
      });
      
      return result;
    } catch (error) {
      console.error('Failed to parse playlist info:', error);
      console.error('Raw content was:', content);
      
      // Return fallback values
      const fallback = {
        name: 'vibes',
        description: 'A carefully curated musical journey.',
        colorPalette: ['#6366f1', '#8b5cf6', '#a855f7'],
        keywords: ['indie', 'atmospheric', 'vibes'],
      };
      
      console.log('⚠️ Using fallback playlist info:', fallback);
      return fallback;
    }
  }

  // Generate cover image using DALL-E
  private async generateCoverImage(emojis: string[], vibe: string, colorPalette: string[]): Promise<string> {
    const colorString = colorPalette.join(', ');
    const emojiString = emojis.join(' ');
    const prompt = `
    Create a hand-painted, surreal scene that captures the mood: "${vibe}".
    The visual style should resemble traditional concept art or illustrated storybooks — with loose, expressive brush strokes, visible sketch lines, and layered textures.
    
    Inspiration comes from the feeling of "${vibe}" and the emotional tone of these emojis: ${emojiString}. Let the shapes and colors be abstractly guided by that emotion, not literally.
    
    Use a muted or fantastical palette influenced by these colors: ${colorString}.
    The artwork should feel cinematic, emotionally immersive, and slightly imperfect — as if painted by hand.
    
    Final style: painterly, analog, whimsical, textured — with soft lighting, sketch-like details, and a grainy film overlay.
    
    MANDATORY: No text, symbols, emojis.
    `;
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024', // Square format for Spotify
        quality: 'standard', // Use standard quality to keep file size under 256KB
        style: 'natural',
        response_format: 'url', // Ensure we get a URL
      }),
    });

    if (!response.ok) {
      throw new Error(`DALL-E API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.[0]?.url || '';
  }

  // Get user-friendly error message for Spotify issues
  private getSpotifyErrorMessage(error: any): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('timeout')) {
        return 'Playlist generation took too long. Try reducing the number of songs or check your internet connection.';
      } else if (message.includes('authentication required') || message.includes('401')) {
        return 'Please reconnect to Spotify. Your session may have expired.';
      } else if (message.includes('404')) {
        return 'Some Spotify features are temporarily unavailable. Please try again later.';
      } else if (message.includes('rate limit') || message.includes('429')) {
        return 'Too many requests to Spotify. Please wait a moment and try again.';
      } else if (message.includes('network') || message.includes('fetch')) {
        return 'Network error connecting to Spotify. Please check your internet connection.';
      } else if (message.includes('scope') || message.includes('permission')) {
        return 'Please reconnect to Spotify to enable all features. Some permissions may have changed.';
      } else if (message.includes('forbidden') || message.includes('403')) {
        return 'Access to this Spotify feature is restricted. Please try a different approach.';
      }
    }
    
    return 'Unable to connect to Spotify. Please check your connection and try again.';
  }

  // Check and handle Spotify authentication issues
  private async checkSpotifyAuth(): Promise<boolean> {
    try {
      const isAuth = await spotifyService.isAuthenticated();
      if (!isAuth) {
        console.error('Spotify authentication check failed');
        return false;
      }
      
      // Try a simple API call to verify the token is still valid
      try {
        await spotifyService.search('test', ['track'], 1, 0);
        return true;
      } catch (error) {
        console.error('Spotify token validation failed:', error);
        return false;
      }
    } catch (error) {
      console.error('Spotify authentication check error:', error);
      return false;
    }
  }

  // Test Spotify service connectivity
  private async testSpotifyService(): Promise<boolean> {
    try {
      console.log('Testing Spotify service connectivity...');
      
      // Check if authenticated
      const isAuth = await this.checkSpotifyAuth();
      console.log(`Spotify authenticated: ${isAuth}`);
      
      if (!isAuth) {
        console.error('Spotify not authenticated');
        return false;
      }
      
      console.log('Spotify service is working - using search-based discovery');
      return true;
    } catch (error) {
      console.error('Spotify service test failed:', error);
      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
        
        // Check if it's a specific type of error
        if (error.message.includes('Authentication required')) {
          console.error('Authentication issue - user needs to login again');
        } else if (error.message.includes('Request timeout')) {
          console.error('Network timeout issue');
        } else if (error.message.includes('Spotify API error')) {
          console.error('Spotify API returned an error - check the detailed error above');
        }
      }
      return false;
    }
  }

  // Enhanced track generation using LLM-generated song titles and artists
  private async generateTracks(
    emojis: string[], 
    songCount: number, 
    vibe: string, 
    keywords: string[]
  ): Promise<SpotifyTrack[]> {
    console.log('🎵 Generating tracks for:', { emojis, vibe, songCount, keywords });
    
    // Test Spotify service first
    const spotifyWorking = await this.testSpotifyService();
    if (!spotifyWorking) {
      throw new Error('Spotify service is not available. Please check your connection and authentication.');
    }
    
    // Step 1: Generate specific song titles and artists using GPT-4o
    const songSuggestions = await this.generateSongSuggestions(emojis, vibe, songCount, keywords);
    console.log('🎼 Generated song suggestions:', songSuggestions.length);
    
    // Step 2: Search for each suggested song to get Spotify URIs
    const tracks = await this.findTracksFromSuggestions(songSuggestions, songCount);
    
    console.log(`🎯 Final playlist: ${tracks.length} tracks (requested: ${songCount})`);
    return tracks;
  }

  // Streaming track generation with progress updates
  private async generateTracksStreaming(
    emojis: string[], 
    songCount: number, 
    vibe: string, 
    keywords: string[],
    onProgress?: (playlist: Partial<PlaylistData>, progress: { current: number; total: number; phase: string }) => void
  ): Promise<SpotifyTrack[]> {
    console.log('🎵 Generating tracks with streaming for:', { emojis, vibe, songCount, keywords });
    
    // Test Spotify service first
    const spotifyWorking = await this.testSpotifyService();
    if (!spotifyWorking) {
      throw new Error('Spotify service is not available. Please check your connection and authentication.');
    }
    
    // Step 1: Generate specific song titles and artists using GPT-4o
    onProgress?.({ 
      emojis, 
      songCount, 
      vibe,
      tracks: []
    }, { current: 0, total: songCount, phase: 'Finding songs...' });
    
    const songSuggestions = await this.generateSongSuggestions(emojis, vibe, songCount, keywords);
    console.log('🎼 Generated song suggestions:', songSuggestions.length);
    
    // Step 2: Search for each suggested song to get Spotify URIs with streaming updates
    const tracks = await this.findTracksFromSuggestionsStreaming(songSuggestions, songCount, onProgress);
    
    console.log(`🎯 Final playlist: ${tracks.length} tracks (requested: ${songCount})`);
    return tracks;
  }

  // Generate specific song titles and artists using LLM
  private async generateSongSuggestions(emojis: string[], vibe: string, songCount: number, keywords: string[]): Promise<Array<{title: string, artist: string}>> {
    const emojiString = emojis.join(' ');
    const keywordString = keywords.join(', ');
    
    const prompt = `Mood: "${vibe}"
Emojis: ${emojiString}
Music Keywords: ${keywordString}

Generate a playlist of ${songCount + 10} songs that match this mood and imagery. Use the provided music keywords to guide your song selection. Mix known tracks with unique, niche picks. Each song should emotionally reflect this vibe. Avoid repeating artists.

Format: "Song Title – Artist"

Please respond with a JSON array of objects in this exact format:
[
  {"title": "Song Title", "artist": "Artist Name"},
  {"title": "Another Song", "artist": "Another Artist"}
]

Guidelines:
- Use the provided music keywords (${keywordString}) to guide your song selection
- Choose real, existing songs that match the vibe and mood
- Include a mix of popular and lesser-known tracks
- Consider the emotional tone suggested by the emojis
- Include songs from different genres that fit the mood
- Make sure song titles and artist names are accurate
- Avoid very obscure songs that might not be on Spotify
- Include songs from different decades and styles
- Consider the energy level and tempo that matches the vibe
- Focus on songs that are likely to be available on Spotify
- Include both contemporary and classic songs
- Prioritize songs that align with the provided keywords
Make sure all suggestions are real songs by real artists that would be available on Spotify.`;

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
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    try {
      // Clean up the response content to handle common JSON formatting issues
      let cleanedContent = content.trim();
      
      // Remove any markdown code blocks if present
      cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      
      // Remove any leading/trailing backticks or other characters
      cleanedContent = cleanedContent.replace(/^[`'"]+/, '').replace(/[`'"]+$/, '');
      
      // Try to extract JSON array if it's wrapped in other text
      const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
      }
      
      console.log('🔍 Attempting to parse cleaned content:', cleanedContent.substring(0, 200) + '...');
      
      const parsed = JSON.parse(cleanedContent);
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid response format - expected array');
      }
      
      // Validate the structure and clean up the data
      const validSuggestions = parsed
        .filter(item => 
          item && 
          typeof item.title === 'string' && 
          typeof item.artist === 'string' &&
          item.title.trim().length > 0 &&
          item.artist.trim().length > 0
        )
        .map(item => ({
          title: item.title.trim(),
          artist: item.artist.trim()
        }));
      
      console.log(`✅ Generated ${validSuggestions.length} valid song suggestions`);
      return validSuggestions;
    } catch (error) {
      console.error('Failed to parse song suggestions:', error);
      console.error('Raw content was:', content);
      
      // Fallback: try to extract song suggestions from the text using regex
      try {
        console.log('🔄 Attempting fallback parsing...');
        const fallbackSuggestions = this.parseSongSuggestionsFromText(content);
        if (fallbackSuggestions.length > 0) {
          console.log(`✅ Fallback parsing found ${fallbackSuggestions.length} suggestions`);
          return fallbackSuggestions;
        }
      } catch (fallbackError) {
        console.error('Fallback parsing also failed:', fallbackError);
      }
      
      throw new Error('Failed to generate song suggestions. Please try again.');
    }
  }

  // Search for each suggested song to get Spotify URIs
  private async findTracksFromSuggestions(songSuggestions: Array<{title: string, artist: string}>, targetCount: number): Promise<SpotifyTrack[]> {
    const tracks: SpotifyTrack[] = [];
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 10; // Stop if we fail to find 10 songs in a row
    
    console.log(`🔍 Searching for ${songSuggestions.length} suggested songs`);
    
    // Search for each song individually
    for (const suggestion of songSuggestions) {
      if (tracks.length >= targetCount) {
        console.log(`✅ Found enough tracks (${tracks.length}/${targetCount}), stopping search`);
        break;
      }
      
      // Stop if we've had too many consecutive failures
      if (consecutiveFailures >= maxConsecutiveFailures) {
        console.log(`⚠️ Stopping search after ${maxConsecutiveFailures} consecutive failures`);
        break;
      }
      
      try {
        const searchQuery = `${suggestion.title} ${suggestion.artist}`;
        console.log(`🔍 Searching for: "${searchQuery}" (${tracks.length + 1}/${targetCount})`);
        
        const searchResponse = await spotifyService.search(
          searchQuery,
          ['track'],
          1, // Get just the top result
          0
        );
        
        if (searchResponse.tracks.items.length > 0) {
          const track = searchResponse.tracks.items[0];
          console.log(`✅ Found: "${track.name}" by ${track.artists.map(a => a.name).join(', ')}`);
          tracks.push(track);
          consecutiveFailures = 0; // Reset failure counter
        } else {
          consecutiveFailures++;
          console.log(`❌ No results found for "${searchQuery}" (failure ${consecutiveFailures})`);
        }
        
        // Add small delay to respect rate limits
        await this.delay(50); // Reduced delay for faster processing
        
      } catch (error) {
        consecutiveFailures++;
        console.warn(`Search failed for "${suggestion.title}" by ${suggestion.artist}:`, error);
      }
    }
    
    console.log(`✅ Found ${tracks.length} tracks from suggestions`);
    return tracks;
  }

  // Streaming search for each suggested song with progress updates
  private async findTracksFromSuggestionsStreaming(
    songSuggestions: Array<{title: string, artist: string}>, 
    targetCount: number,
    onProgress?: (playlist: Partial<PlaylistData>, progress: { current: number; total: number; phase: string }) => void
  ): Promise<SpotifyTrack[]> {
    const tracks: SpotifyTrack[] = [];
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 10; // Stop if we fail to find 10 songs in a row
    
    console.log(`🔍 Searching for ${songSuggestions.length} suggested songs with streaming`);
    
    // Search for each song individually
    for (const suggestion of songSuggestions) {
      if (tracks.length >= targetCount) {
        console.log(`✅ Found enough tracks (${tracks.length}/${targetCount}), stopping search`);
        break;
      }
      
      // Stop if we've had too many consecutive failures
      if (consecutiveFailures >= maxConsecutiveFailures) {
        console.log(`⚠️ Stopping search after ${maxConsecutiveFailures} consecutive failures`);
        break;
      }
      
      try {
        const searchQuery = `${suggestion.title} ${suggestion.artist}`;
        console.log(`🔍 Searching for: "${searchQuery}" (${tracks.length + 1}/${targetCount})`);
        
        const searchResponse = await spotifyService.search(
          searchQuery,
          ['track'],
          1, // Get just the top result
          0
        );
        
        if (searchResponse.tracks.items.length > 0) {
          const track = searchResponse.tracks.items[0];
          console.log(`✅ Found: "${track.name}" by ${track.artists.map(a => a.name).join(', ')}`);
          tracks.push(track);
          consecutiveFailures = 0; // Reset failure counter
          
          // Send progress update with current tracks
          onProgress?.({ 
            tracks: [...tracks] // Send a copy of current tracks
          }, { 
            current: tracks.length, 
            total: targetCount, 
            phase: `Found ${tracks.length} of ${targetCount} songs...` 
          });
        } else {
          consecutiveFailures++;
          console.log(`❌ No results found for "${searchQuery}" (failure ${consecutiveFailures})`);
        }
        
        // Add small delay to respect rate limits
        await this.delay(50); // Reduced delay for faster processing
        
      } catch (error) {
        consecutiveFailures++;
        console.warn(`Search failed for "${suggestion.title}" by ${suggestion.artist}:`, error);
      }
    }
    
    console.log(`✅ Found ${tracks.length} tracks from suggestions`);
    return tracks;
  }

  // Calculate vibe accuracy bonus
  private calculateVibeAccuracyBonus(tracks: SpotifyTrack[], vibe: string, emojis: string[]): number {
    let bonus = 0;
    
    // Check if tracks align with the vibe
    const vibeAlignmentCount = tracks.filter(track => {
      const trackTitle = track.name.toLowerCase();
      const artistName = track.artists.map(artist => artist.name.toLowerCase()).join(' ');
      
      // Check for vibe-appropriate terms
      const vibeTerms = vibe.toLowerCase().split(' ');
      
      return vibeTerms.some(term => 
        trackTitle.includes(term) || artistName.includes(term)
      );
    }).length;
    
    // Bonus for tracks that align with vibe
    bonus += (vibeAlignmentCount / tracks.length) * 20; // Max 20 points
    
    return bonus;
  }

  // Calculate playlist uniqueness score
  private calculatePlaylistUniquenessScore(tracks: SpotifyTrack[], vibe: string, emojis: string[]): number {
    if (tracks.length === 0) return 0;
    
    let score = 0;
    
    // 1. Artist diversity (higher score for more unique artists)
    const uniqueArtists = new Set(tracks.map(track => track.artists[0]?.id).filter(Boolean));
    const artistDiversityScore = (uniqueArtists.size / tracks.length) * 40; // Max 40 points
    score += artistDiversityScore;
    
    // 2. Title uniqueness (longer, more unique titles get higher scores)
    const titleScores = tracks.map(track => {
      const words = track.name.toLowerCase().split(' ').length;
      const uniqueWords = new Set(track.name.toLowerCase().split(' ')).size;
      return Math.min((words + uniqueWords) / 2, 10); // Max 10 points per track
    });
    const avgTitleScore = titleScores.reduce((sum, score) => sum + score, 0) / tracks.length;
    score += avgTitleScore;
    
    // 3. Vibe accuracy bonus
    const vibeAccuracyBonus = this.calculateVibeAccuracyBonus(tracks, vibe, emojis);
    score += vibeAccuracyBonus;
    
    // Normalize to 0-100 scale
    return Math.min(Math.max(Math.round(score), 0), 100);
  }

  // Save playlist to Spotify
  async saveToSpotify(playlistData: PlaylistData): Promise<PlaylistData> {
    console.log('playlistService.saveToSpotify called');
    console.log('Checking Spotify authentication...');
    
    if (!(await this.checkSpotifyAuth())) {
      console.log('Spotify not authenticated, throwing error');
      throw new Error('Please connect to Spotify first');
    }
    
    console.log('Spotify authenticated, proceeding with save');
    console.log('Playlist data:', { name: playlistData.name, trackCount: playlistData.tracks.length });

    const trackUris = playlistData.tracks.map(track => track.uri);
    console.log('Track URIs prepared, count:', trackUris.length);
    
    console.log('Creating playlist with tracks...');
    const spotifyPlaylist = await spotifyService.createPlaylistWithTracks(
      playlistData.name,
      playlistData.description,
      trackUris,
      true
    );
    console.log('Playlist created successfully:', spotifyPlaylist.id);

    const result = {
      ...playlistData,
      id: spotifyPlaylist.id,
      spotifyUrl: spotifyPlaylist.external_urls.spotify,
      isSpotifyPlaylist: true,
    };
    
    console.log('saveToSpotify completed successfully, returning result');
    return result;
  }

  // Fallback method to parse song suggestions from text when JSON parsing fails
  private parseSongSuggestionsFromText(text: string): Array<{title: string, artist: string}> {
    const suggestions: Array<{title: string, artist: string}> = [];
    
    // Try different patterns to extract song - artist pairs
    const patterns = [
      // Pattern: "Song Title" - "Artist Name"
      /"([^"]+)"\s*[-–—]\s*"([^"]+)"/g,
      // Pattern: Song Title - Artist Name (without quotes)
      /([^-\n]+?)\s*[-–—]\s*([^\n]+)/g,
      // Pattern: Song Title by Artist Name
      /([^b\n]+?)\s+by\s+([^\n]+)/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const title = match[1]?.trim();
        const artist = match[2]?.trim();
        
        if (title && artist && title.length > 0 && artist.length > 0) {
          // Avoid duplicates
          const exists = suggestions.some(s => 
            s.title.toLowerCase() === title.toLowerCase() && 
            s.artist.toLowerCase() === artist.toLowerCase()
          );
          
          if (!exists) {
            suggestions.push({ title, artist });
          }
        }
      }
      
      // If we found suggestions with this pattern, use them
      if (suggestions.length > 0) {
        break;
      }
    }
    
    return suggestions;
  }
}

export const playlistService = new PlaylistService(); 