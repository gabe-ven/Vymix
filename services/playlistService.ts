import { spotifyService } from './spotify';
import { OPENAI_API_KEY } from '../env';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

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

  /**
   * Internal: Generate playlist (non-streaming)
   */
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
    };
  }

  /**
   * Internal: Generate playlist with streaming updates
   */
  private async _generatePlaylistStreaming(
    emojis: string[],
    songCount: number,
    vibe: string,
    onProgress?: (playlist: Partial<PlaylistData>, progress: { current: number; total: number; phase: string }) => void
  ): Promise<PlaylistData> {
    try {
      console.log('🎵 Generating playlist with streaming for:', { emojis, songCount, vibe });
      
      // Step 1: Generate playlist info (name, description, colors, keywords)
      onProgress?.({}, { current: 1, total: 4, phase: 'Generating playlist info...' });
      const playlistInfo = await this.generatePlaylistInfo(emojis, vibe);
      
      console.log('🎵 Generated playlist info:', {
        name: playlistInfo.name,
        description: playlistInfo.description,
        colorPalette: playlistInfo.colorPalette,
        keywords: playlistInfo.keywords
      });
      
      // Step 2: Generate cover image
      onProgress?.({ ...playlistInfo }, { current: 2, total: 4, phase: 'Generating cover image...' });
      console.log('🎵 Starting cover image generation...');
      
      let coverImageUrl = '';
      try {
        coverImageUrl = await this.generateCoverImage(emojis, vibe, playlistInfo.colorPalette);
        console.log('🎵 Cover image generation result:', coverImageUrl ? 'SUCCESS' : 'FAILED');
      } catch (coverError) {
        console.error('🎵 Cover image generation failed:', coverError);
        coverImageUrl = ''; // Ensure it's empty string if failed
      }
      
      // Step 3: Generate tracks
      onProgress?.({ ...playlistInfo, coverImageUrl }, { current: 3, total: 4, phase: 'Finding songs...' });
      const tracks = await this.generateTracksStreaming(emojis, songCount, vibe, playlistInfo.keywords, onProgress);
      
      console.log('🎵 Generated tracks:', tracks.length);
      
      // Step 4: Create final playlist
      onProgress?.({ ...playlistInfo, coverImageUrl, tracks }, { current: 4, total: 4, phase: 'Finalizing playlist...' });
      
      const playlist: PlaylistData = {
        name: playlistInfo.name,
        description: playlistInfo.description,
        colorPalette: playlistInfo.colorPalette,
        keywords: playlistInfo.keywords,
        coverImageUrl: coverImageUrl, // This might be empty string if generation failed
        emojis,
        songCount,
        vibe,
        tracks,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('🎵 Final playlist created:', {
        name: playlist.name,
        trackCount: playlist.tracks.length,
        hasCoverImage: !!playlist.coverImageUrl,
        coverImageUrl: playlist.coverImageUrl ? 'PRESENT' : 'MISSING'
      });
      
      return playlist;
    } catch (error) {
      console.error('🎵 Error in playlist generation:', error);
      throw error;
    }
  }

  /**
   * Generate playlist info using OpenAI (returns name, description, colorPalette, keywords)
   */
  private async generatePlaylistInfo(emojis: string[], vibe: string) {
    const emojiString = emojis.join(' ');
    const isSpecific = await this.isSpecificRequest(vibe);
    let prompt: string;

    if (isSpecific) {
      prompt = `Create a music playlist name, description, and color palette for: "${vibe}"

Please respond with a JSON object in this exact format:
{
  "name": "Creative playlist name here",
  "description": "A single compelling sentence that captures the playlist's theme",
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "keywords": []
}

The playlist name should be:
- Creative and unique - avoid common playlist naming patterns
- Use 1-3 words maximum, all lowercase
- Invent new words, use obscure terms, or combine words in unexpected ways
- Consider the specific source material - make it feel personal to "${vibe}"
- IMPORTANT: Do NOT include any emoji-style in the playlist name - only use them as inspiration for the mood

Description guidelines:
- Write a highly original one-line description, all in lowercase.
- Be SPECIFIC to "${vibe}" - reference the actual content, characters, themes, or atmosphere
- Capture the unique essence and emotional core of the source material
- No generic music terms, no genre names, no cliches, no lists, no hashtags, no emojis
- Keep it under 15 words. And all lowercase.
- Examples for anime: "the sound of titans breaking walls" or "when eren's rage meets the sea"
- Examples for movies: "where lightsabers hum in the dark" or "the force flows through everything"
- Examples for artists: "weeknd's neon-lit midnight drives" or "taylor's folklore forest whispers"

For the color palette, generate 3 colors in hex format based on the visual style and mood of "${vibe}". 
IMPORTANT: Do NOT use black (#000000), white (#FFFFFF), or any very dark (#111111, #222222) or very light (#FEFEFE, #EEEEEE) colors. 
Choose colors that are visually distinct from each other and match the source material's aesthetic.

For keywords: Leave as empty array [] since this is a specific request that should focus directly on the source material.`;
    } else {
      prompt = `Create a music playlist name, description, and color palette based on:
- These emojis: ${emojiString}
- User's vibe/mood: "${vibe}"

Please respond with a JSON object in this exact format:
{
  "name": "Creative playlist name here",
  "description": "A single compelling sentence that captures the playlist's mood and vibe",
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

The playlist name should be:
- Creative and unique - avoid common playlist naming patterns
- Use 1-3 words maximum, all lowercase
- Invent new words, use obscure terms, or combine words in unexpected ways
- Consider the specific emojis and vibe - make it feel personal to this exact combination
- IMPORTANT: Do NOT include any emoji-style in the playlist name - only use them as inspiration for the mood
- Examples of the style: "nightglow", "vaporhaze", "glasswave", "solstice", "dreamtide", "pulsefield", "lumen", "aether", "velvetine", "mistline"

Description guidelines:
- Write a highly original one-line description, all in lowercase.
- No music terms, no genre names, no cliches, no lists, no hashtags, no emojis.
- Keep it under 15 words. And all lowercase.

For the color palette, generate 3 colors in hex format based on the vibe. 
IMPORTANT: Do NOT use black (#000000), white (#FFFFFF), or any very dark (#111111, #222222) or very light (#FEFEFE, #EEEEEE) colors. 
Choose colors that are visually distinct from each other and match the mood.

For the keywords, generate 8-12 specific music-related terms that would help find songs on Spotify. These should be:
- Genre names (e.g., "indie rock", "electronic", "jazz")
- Mood descriptors (e.g., "energetic", "chill", "romantic")
- Tempo indicators (e.g., "upbeat", "slow", "dance")
- Era or style (e.g., "80s", "acoustic", "synthwave")
- Artist types (e.g., "female vocalists", "instrumental")
- Specific musical terms (e.g., "guitar", "piano", "synth", "drums")

Examples: ["indie pop", "energetic", "summer vibes", "guitar", "upbeat", "feel good"] or ["jazz", "chill", "late night", "piano", "smooth", "relaxing"]`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8, // Good balance of creativity and consistency
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
      cleanedContent = cleanedContent.replace(/^[`'\"]+/, '').replace(/[`'\"]+$/, '');
      
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
        keywords: isSpecific ? [] : (parsed.keywords || ['indie', 'atmospheric', 'vibes']),
      };
      
      console.log('✅ Generated playlist info:', { 
        name: result.name, 
        description: result.description.substring(0, 50) + '...',
        colorCount: result.colorPalette.length,
        keywordCount: result.keywords.length,
        isSpecific
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
        keywords: isSpecific ? [] : ['indie', 'atmospheric', 'vibes'],
      };
      
      console.log('⚠️ Using fallback playlist info:', fallback);
      return fallback;
    }
  }

  /**
   * Generate cover image using DALL-E (with colorPalette)
   */
  private async generateCoverImage(emojis: string[], vibe: string, colorPalette: string[]): Promise<string> {
    try {
      // Check if OpenAI API key is configured
      if (!OPENAI_API_KEY) {
        console.warn('🎨 OpenAI API key not configured, skipping cover image generation');
        return '';
      }
      
      const colorString = colorPalette.join(', ');
      const emojiString = emojis.join(' ');
      
      console.log('🎨 Generating cover image for:', { vibe, emojis, colorPalette });
      
      // Check if this is a specific request to customize the prompt
      const isSpecific = await this.isSpecificRequest(vibe);
    
    let prompt: string;
    
    if (isSpecific) {
      // For specific requests (like "Batman songs"), extract the mood/theme and create a generic artistic prompt
      const artisticPrompt = await this.generateArtisticPromptFromSpecificRequest(vibe, colorString);
      prompt = artisticPrompt;
    } else {
      // Generic prompt for vibe-based requests
      prompt = `
Create an impressionist, hand-painted artwork in the style of oil on canvas that visually expresses the essence of: ${vibe}.
The style should be impressionist painting, loose expressive brushstrokes, vivid color, analog, painterly, oil on canvas, plein air, imperfect, hand-painted look. No photorealism, no cartoon, no digital smoothness.

Inspiration comes from the mood/topic of "${vibe}" and these emojis: ${emojiString}. DO NOT INCLUDE THE EMOJIS IN THE IMAGE.

Use a cinematic, analog-inspired color palette with dreamlike or fantastical tones.

The style should be inspired by:
- Studio Ghibli background art
- Lo-fi fantasy album covers
- Impressionist painters
- Artists like Ian McQue, Simon Stålenhag, or Eyvind Earle
- The texture of oil pastels or gouache on canvas

Desired look: grainy, sketch-like, whimsical, imperfect. Visible brushstrokes. No hard outlines. No glossy realism. Subtle lighting and analog warmth.

MANDATORY: No text, logos, or emojis in the image.
`;
    }

    console.log('🎨 Sending prompt to DALL-E:', prompt.substring(0, 200) + '...');
    
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
        size: '1024x1024', // DALL-E 3 minimum size
        quality: 'standard', // Use standard quality to keep file size under 256KB
        style: 'natural',
        response_format: 'url', // Ensure we get a URL
      }),
    });

    if (!response.ok) {
      // Try to get detailed error information from response body
      let errorDetails = response.statusText;
      try {
        const errorBody = await response.json();
        if (errorBody.error) {
          errorDetails = `${errorBody.error.message || errorBody.error} (${response.status})`;
        } else if (errorBody.message) {
          errorDetails = `${errorBody.message} (${response.status})`;
        }
      } catch (parseError) {
        // If we can't parse the error body, use status text
        errorDetails = `${response.statusText || 'Unknown error'} (${response.status})`;
      }
      
      console.error('🎨 DALL-E API error:', response.status, errorDetails);
      console.error('🎨 Prompt that caused error:', prompt.substring(0, 500) + '...');
      throw new Error(`DALL-E API error: ${errorDetails}`);
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;
    
    if (!imageUrl) {
      console.warn('🎨 No image URL received from DALL-E');
      return '';
    }

    console.log('🎨 DALL-E response received, downloading and uploading to Firebase Storage...');
    
    // Download the image and upload to Firebase Storage for permanent storage
    try {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }
      
      const arrayBuffer = await imageResponse.arrayBuffer();
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const filename = `playlist-covers/${timestamp}-${randomId}.jpg`;
      
      // Upload to Firebase Storage
      const storageRef = storage().ref(filename);
      
      // Convert ArrayBuffer to base64 for React Native compatibility
      const uint8Array = new Uint8Array(arrayBuffer);
      let binaryString = '';
      
      // Process in chunks to avoid stack overflow
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, chunk as any);
      }
      
      const base64 = btoa(binaryString);
      
      console.log('🎨 Uploading image to Firebase Storage...');
      await storageRef.putString(base64, 'base64', { contentType });
      
      // Get the permanent download URL
      const downloadURL = await storageRef.getDownloadURL();
      
      console.log('🎨 Successfully uploaded image to Firebase Storage:', downloadURL);
      return downloadURL;
      
    } catch (uploadError) {
      console.error('🎨 Failed to upload image to Firebase Storage:', uploadError);
      console.warn('🎨 Falling back to temporary URL (may expire)');
      return imageUrl; // Fallback to temporary URL if upload fails
    }
    
    } catch (error) {
      console.error('🎨 DALL-E image generation failed:', error);
      
      // Provide specific guidance based on error type
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('400')) {
          console.warn('🎨 DALL-E 400 error - likely content policy violation or invalid prompt');
        } else if (message.includes('401')) {
          console.warn('🎨 DALL-E 401 error - API key issue');
        } else if (message.includes('429')) {
          console.warn('🎨 DALL-E 429 error - rate limit exceeded');
        } else if (message.includes('timeout')) {
          console.warn('🎨 DALL-E timeout error');
        }
      }
      
      console.warn('🎨 Continuing without cover image...');
      return ''; // Return empty string to indicate no cover image
    }
  }

  /**
   * Generate artistic prompt from specific requests by extracting mood/theme
   * This avoids copyright issues by creating generic artistic descriptions
   */
  private async generateArtisticPromptFromSpecificRequest(vibe: string, colorString: string): Promise<string> {
    try {
      const prompt = `Analyze this music request and extract the artistic mood, atmosphere, and visual themes that could inspire album artwork. DO NOT mention any specific copyrighted characters, franchises, or intellectual property.

Request: "${vibe}"

Extract and describe:
1. The overall mood/atmosphere (e.g., dark, mysterious, heroic, peaceful, energetic)
2. Visual themes and elements (e.g., urban landscapes, nature, technology, fantasy, sci-fi)
3. Color associations and lighting (e.g., neon-lit, sunset, moonlight, stormy)
4. Artistic style inspiration (e.g., noir, cyberpunk, pastoral, cosmic)

Respond with ONLY a brief artistic description (2-3 sentences) that captures the essence without any copyrighted references. Focus on the emotional and visual qualities that would make compelling album artwork.

Example transformations:
- "Batman songs" → "dark urban atmosphere with mysterious shadows and neon-lit cityscapes"
- "Studio Ghibli vibes" → "whimsical pastoral landscapes with soft natural lighting and dreamlike atmosphere"
- "Star Wars music" → "cosmic sci-fi atmosphere with dramatic lighting and futuristic elements"`;

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
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const artisticDescription = data.choices?.[0]?.message?.content?.trim();
      
      if (!artisticDescription) {
        throw new Error('No response from OpenAI');
      }

      console.log('🎨 Generated artistic description:', artisticDescription);

      // Create the DALL-E prompt using the extracted artistic description
      const dallEPrompt = `
Create an impressionist, hand-painted artwork in the style of oil on canvas that captures: ${artisticDescription}

Style: impressionist painting, loose expressive brushstrokes, vivid color, analog, painterly, oil on canvas, plein air, imperfect, hand-painted look. No photorealism, no cartoon, no digital smoothness.
Color palette: ${colorString} - use these colors as the primary palette.

The style should be inspired by:
- Studio Ghibli background art
- Lo-fi fantasy album covers
- Impressionist painters
- Artists like Ian McQue, Simon Stålenhag, or Eyvind Earle
- The texture of oil pastels or gouache on canvas

Desired look: grainy, sketch-like, whimsical, imperfect. Visible brushstrokes. No hard outlines. No glossy realism. Subtle lighting and analog warmth.

MANDATORY: No text, logos, emojis, or recognizable characters in the image. Create an original artistic interpretation with cinematic atmosphere.
`;

      return dallEPrompt;
    } catch (error) {
      console.error('Failed to generate artistic prompt, using fallback:', error);
      
      // Fallback to a generic cinematic prompt
      return `
Create an impressionist, hand-painted artwork in the style of oil on canvas that captures a cinematic, atmospheric mood.

Style: impressionist painting, loose expressive brushstrokes, vivid color, analog, painterly, oil on canvas, plein air, imperfect, hand-painted look. No photorealism, no cartoon, no digital smoothness.
Color palette: ${colorString} - use these colors as the primary palette.

The style should be inspired by:
- Studio Ghibli background art
- Lo-fi fantasy album covers
- Impressionist painters
- Artists like Ian McQue, Simon Stålenhag, or Eyvind Earle
- The texture of oil pastels or gouache on canvas

Desired look: grainy, sketch-like, whimsical, imperfect. Visible brushstrokes. No hard outlines. No glossy realism. Subtle lighting and analog warmth.

MANDATORY: No text, logos, emojis, or recognizable characters in the image. Create an original artistic interpretation with cinematic atmosphere.
`;
    }
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

  // Simplified AI-driven track generation
  private async generateTracksWithAI(
    emojis: string[], 
    songCount: number, 
    vibe: string, 
    keywords: string[],
    seed: string
  ): Promise<SpotifyTrack[]> {
    console.log('🤖 Generating tracks for:', { emojis, vibe, songCount });
    
    // No history tracking - use empty set for uniqueness within this session
    const usedTrackIds = new Set<string>();
    
    const tracks: SpotifyTrack[] = [];
    let attempts = 0;
    const maxAttempts = 5; // Allow more attempts to ensure we get the full count
    
    while (tracks.length < songCount && attempts < maxAttempts) {
      attempts++;
      console.log(`🎯 Attempt ${attempts}: Need ${songCount - tracks.length} more songs`);
      
      // Check if this is a specific request (anime, movie, etc.) or a generic vibe
      const isSpecific = await this.isSpecificRequest(vibe);
      const remainingSongs = songCount - tracks.length;
      const prompt = isSpecific 
        ? this.generateSpecificRequestPrompt(vibe, emojis, seed, remainingSongs, attempts)
        : this.generateVariedPrompt(emojis, vibe, keywords, seed, remainingSongs, attempts);

      console.log(`🎯 Using ${isSpecific ? 'specific' : 'vibe-based'} prompt for: "${vibe}"`);

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
            temperature: 0.9, // Increased temperature for more variety
            max_tokens: 1000, // Increased for comprehensive suggestions
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

        // Parse song suggestions
        const lines = content.split('\n').filter((line: string) => line.trim().length > 0);
        const suggestions: Array<{title: string, artist: string}> = [];
        
        for (const line of lines) {
          const match = line.match(/"([^"]+)"\s+by\s+(.+)/i);
          if (match) {
            suggestions.push({
              title: match[1].trim(),
              artist: match[2].trim()
            });
          }
        }
        
        console.log(`✅ Found ${suggestions.length} song suggestions`);
        
        // Search for each suggestion on Spotify with variety
        for (const suggestion of suggestions) {
          if (tracks.length >= songCount) break;
          
          try {
            const searchQuery = this.createValidSearchQuery(suggestion.title, suggestion.artist, isSpecific);
            
            // Use enhanced search with variety
            const selectedTrack = await this.searchWithVariety(searchQuery, usedTrackIds, tracks, isSpecific);
            
            if (selectedTrack) {
              tracks.push(selectedTrack);
              usedTrackIds.add(selectedTrack.id); // Track within this session
              console.log(`✅ Found: "${selectedTrack.name}" by ${selectedTrack.artists.map(a => a.name).join(', ')} (${tracks.length}/${songCount})`);
            }
            
            await this.delay(100);
          } catch (error) {
            console.warn(`Search failed for "${suggestion.title}":`, error);
          }
        }
        
        // If we found enough songs, break
        if (tracks.length >= songCount) {
          console.log(`🎯 Successfully found all ${songCount} songs!`);
          break;
        }
        
      } catch (error) {
        console.error('AI generation failed:', error);
      }
    }
    
    console.log(`🎯 Final result: ${tracks.length} tracks found (requested: ${songCount})`);
    return tracks.slice(0, songCount);
  }

  // Streaming version of simplified AI-driven track generation
  private async generateTracksWithAIStreaming(
    emojis: string[], 
    songCount: number, 
    vibe: string, 
    keywords: string[],
    seed: string,
    onProgress?: (playlist: Partial<PlaylistData>, progress: { current: number; total: number; phase: string }) => void
  ): Promise<SpotifyTrack[]> {
    console.log('🤖 Generating tracks with streaming for:', { emojis, vibe, songCount });
    
    // No history tracking - use empty set for uniqueness within this session
    const usedTrackIds = new Set<string>();
    
    const tracks: SpotifyTrack[] = [];
    let attempts = 0;
    const maxAttempts = 5; // Allow more attempts to ensure we get the full count
    
    while (tracks.length < songCount && attempts < maxAttempts) {
      attempts++;
      console.log(`🎯 Attempt ${attempts}: Need ${songCount - tracks.length} more songs`);
      
      // Only show "Generating songs..." on the first attempt
      if (attempts === 1) {
        onProgress?.({ tracks: [...tracks] }, { current: tracks.length, total: songCount, phase: 'Generating songs...' });
      }
      
      // Check if this is a specific request (anime, movie, etc.) or a generic vibe
      const isSpecific = await this.isSpecificRequest(vibe);
      const remainingSongs = songCount - tracks.length;
      const prompt = isSpecific 
        ? this.generateSpecificRequestPrompt(vibe, emojis, seed, remainingSongs, attempts)
        : this.generateVariedPrompt(emojis, vibe, keywords, seed, remainingSongs, attempts);

      console.log(`🎯 Using ${isSpecific ? 'specific' : 'vibe-based'} prompt for: "${vibe}"`);

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
            temperature: 0.9, // Increased temperature for more variety
            max_tokens: 1000, // Increased for comprehensive suggestions
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

        // Parse song suggestions
        const lines = content.split('\n').filter((line: string) => line.trim().length > 0);
        const suggestions: Array<{title: string, artist: string}> = [];
        
        for (const line of lines) {
          const match = line.match(/"([^"]+)"\s+by\s+(.+)/i);
          if (match) {
            suggestions.push({
              title: match[1].trim(),
              artist: match[2].trim()
            });
          }
        }
        
        console.log(`✅ Found ${suggestions.length} song suggestions`);
        
        onProgress?.({ tracks: [...tracks] }, { current: tracks.length, total: songCount, phase: 'Finding songs...' });
        
        // Search for each suggestion on Spotify with variety
        for (const suggestion of suggestions) {
          if (tracks.length >= songCount) break;
          
          try {
            const searchQuery = this.createValidSearchQuery(suggestion.title, suggestion.artist, isSpecific);
            
            // Use enhanced search with variety
            const selectedTrack = await this.searchWithVariety(searchQuery, usedTrackIds, tracks, isSpecific);
            
            if (selectedTrack) {
              tracks.push(selectedTrack);
              usedTrackIds.add(selectedTrack.id); // Track within this session
              console.log(`✅ Found: "${selectedTrack.name}" by ${selectedTrack.artists.map(a => a.name).join(', ')} (${tracks.length}/${songCount})`);
              
              onProgress?.({ tracks: [...tracks] }, { current: tracks.length, total: songCount, phase: `Found ${tracks.length} of ${songCount} songs...` });
            }
            
            await this.delay(100);
          } catch (error) {
            console.warn(`Search failed for "${suggestion.title}":`, error);
          }
        }
        
        // If we found enough songs, break
        if (tracks.length >= songCount) {
          console.log(`🎯 Successfully found all ${songCount} songs!`);
          break;
        }
        
      } catch (error) {
        console.error('AI generation failed:', error);
      }
    }
    
    console.log(`🎯 Final result: ${tracks.length} tracks found (requested: ${songCount})`);
    return tracks.slice(0, songCount);
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
    
    // Generate unique seed for this playlist to ensure randomness
    const playlistSeed = this.generatePlaylistSeed(emojis, vibe, songCount);
    console.log('🎲 Generated playlist seed:', playlistSeed);
    
    // Check if this is a specific request
    const isSpecific = await this.isSpecificRequest(vibe);
    if (isSpecific) {
      console.log('🎯 Detected specific request, focusing on source material directly');
      // For specific requests, we don't use keywords as they can interfere
      const tracks = await this.generateTracksWithAI(emojis, songCount, vibe, [], playlistSeed);
      console.log(`🎯 Final playlist: ${tracks.length} tracks (requested: ${songCount})`);
      return tracks;
    } else {
      // Use enhanced AI approach for generic vibe-based requests
      const tracks = await this.generateTracksWithAI(emojis, songCount, vibe, keywords, playlistSeed);
      console.log(`🎯 Final playlist: ${tracks.length} tracks (requested: ${songCount})`);
      return tracks;
    }
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
    
    // Generate unique seed for this playlist
    const playlistSeed = this.generatePlaylistSeed(emojis, vibe, songCount);
    console.log('🎲 Generated playlist seed:', playlistSeed);
    
    // Check if this is a specific request
    const isSpecific = await this.isSpecificRequest(vibe);
    if (isSpecific) {
      console.log('🎯 Detected specific request, focusing on source material directly');
      // Use simplified AI approach with streaming updates, no keywords
      onProgress?.({ 
        emojis, 
        songCount, 
        vibe,
        tracks: []
      }, { current: 0, total: songCount, phase: 'Starting AI track generation...' });
      
      const tracks = await this.generateTracksWithAIStreaming(emojis, songCount, vibe, [], playlistSeed, onProgress);
      console.log(`🎯 Final playlist: ${tracks.length} tracks (requested: ${songCount})`);
      return tracks;
    } else {
      // Use simplified AI approach with streaming updates
      onProgress?.({ 
        emojis, 
        songCount, 
        vibe,
        tracks: []
      }, { current: 0, total: songCount, phase: 'Starting AI track generation...' });
      
      const tracks = await this.generateTracksWithAIStreaming(emojis, songCount, vibe, keywords, playlistSeed, onProgress);
      console.log(`🎯 Final playlist: ${tracks.length} tracks (requested: ${songCount})`);
      return tracks;
    }
  }

  // Generate a unique seed for this playlist to ensure randomness
  private generatePlaylistSeed(emojis: string[], vibe: string, songCount: number): string {
    const timestamp = Date.now();
    const emojiHash = emojis.join('').split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const vibeHash = vibe.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    
    // Enhanced randomness with multiple entropy sources
    const randomFactor1 = Math.random() * 1000000;
    const randomFactor2 = Math.random() * 1000000;
    const randomFactor3 = Math.random() * 1000000;
    
    // Add microsecond precision and process-specific randomness
    const microTime = performance.now();
    const processRandom = Math.random() * 1000000;
    
    // Create a more complex seed with multiple layers of randomness
    const seed = `${timestamp}-${microTime}-${emojiHash}-${vibeHash}-${songCount}-${randomFactor1}-${randomFactor2}-${randomFactor3}-${processRandom}`;
    
    // Create a hash of the seed for consistency
    const seedHash = this.hashString(seed);
    
    return `${seedHash}-${timestamp}`;
  }

  // Simple hash function for seed consistency
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
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

    // Upload cover image if available
    if (playlistData.coverImageUrl) {
      console.log('Uploading cover image to Spotify playlist...');
      try {
        await spotifyService.uploadPlaylistCoverImage(spotifyPlaylist.id, playlistData.coverImageUrl);
        console.log('Cover image uploaded successfully');
      } catch (error) {
        console.warn('Failed to upload cover image, but playlist was created successfully:', error);
      }
    } else {
      console.log('No cover image available to upload');
    }

    const result = {
      ...playlistData,
      id: spotifyPlaylist.id,
      spotifyUrl: spotifyPlaylist.external_urls.spotify,
      isSpotifyPlaylist: true,
    };
    
    console.log('saveToSpotify completed successfully, returning result');
    return result;
  }

  // Create a valid search query that stays within Spotify's 250 character limit
  private createValidSearchQuery(title: string, artist: string, isSpecific: boolean = false): string {
    // For specific requests, prioritize the artist name
    if (isSpecific) {
      // Clean and truncate the artist name
      const cleanArtist = artist.trim().replace(/[^\w\s\-'&]/g, '').substring(0, 100);
      
      // For artist-specific requests, search by artist name first
      let searchQuery = cleanArtist;
      
      // If the title is provided and not just a generic term, include it
      const cleanTitle = title.trim().replace(/[^\w\s\-'&]/g, '').substring(0, 50);
      if (cleanTitle && cleanTitle.length > 2 && !cleanTitle.toLowerCase().includes('song') && !cleanTitle.toLowerCase().includes('track')) {
        searchQuery = `${cleanTitle} ${cleanArtist}`;
      }
      
      // Ensure it's within Spotify's 250 character limit
      if (searchQuery.length > 240) {
        searchQuery = cleanArtist.substring(0, 240);
      }
      
      return searchQuery;
    } else {
      // Original logic for generic requests
      const cleanTitle = title.trim().replace(/[^\w\s\-'&]/g, '').substring(0, 50);
      const cleanArtist = artist.trim().replace(/[^\w\s\-'&]/g, '').substring(0, 50);
      
      // Create the search query
      let searchQuery = `${cleanTitle} ${cleanArtist}`;
      
      // Ensure it's within Spotify's 250 character limit
      if (searchQuery.length > 240) { // Leave some buffer
        // Try with just title and first word of artist
        const artistFirstWord = cleanArtist.split(' ')[0];
        searchQuery = `${cleanTitle} ${artistFirstWord}`;
        
        // If still too long, truncate title
        if (searchQuery.length > 240) {
          const maxTitleLength = 240 - artistFirstWord.length - 1; // -1 for space
          searchQuery = `${cleanTitle.substring(0, maxTitleLength)} ${artistFirstWord}`;
        }
      }
      
      return searchQuery;
    }
  }

  // Get a random search offset to increase variety
  private getRandomSearchOffset(): number {
    // Random offset between 0-20 to get different search results
    return Math.floor(Math.random() * 20);
  }

  // Enhanced search with variety
  private async searchWithVariety(query: string, usedTrackIds: Set<string>, existingTracks: SpotifyTrack[], isSpecific: boolean = false): Promise<SpotifyTrack | null> {
    const maxRetries = 3;
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const searchQuery = this.createValidSearchQuery(query, '', isSpecific);
        const offset = this.getRandomSearchOffset();
        
        console.log(`🎯 Search attempt ${attempt}/${maxRetries} for: "${searchQuery}" (offset: ${offset})`);
        
        const searchResponse = await spotifyService.search(searchQuery, ['track'], 10, offset);

        if (searchResponse.tracks.items.length === 0) {
          console.log(`🎯 No tracks found for: "${searchQuery}"`);
          return null;
        }

        // Find a track that hasn't been used yet
        for (const track of searchResponse.tracks.items) {
          if (!usedTrackIds.has(track.id)) {
            console.log(`✅ Found: "${track.name}" by ${track.artists.map((a: SpotifyArtist) => a.name).join(', ')}`);
            return track;
          }
        }

        console.log(`🎯 All tracks already used for: "${searchQuery}"`);
        return null;
        
      } catch (error) {
        lastError = error;
        console.warn(`Search failed for "${query}":`, error);
        
        // If it's a 502 error and we have retries left, continue
        if (error instanceof Error && error.message.includes('502') && attempt < maxRetries) {
          console.log(`🎯 502 error, retrying in ${attempt * 2} seconds...`);
          await this.delay(attempt * 2000);
          continue;
        }
        
        // For other errors or final attempt, break
        break;
      }
    }
    
    // If we get here, all retries failed
    console.warn(`Search failed for "${query}" after ${maxRetries} attempts:`, lastError);
    return null;
  }

  // Generate varied prompts for AI to ensure different responses
  private generateVariedPrompt(emojis: string[], vibe: string, keywords: string[], seed: string, songCount: number, attempt: number): string {
    const promptVariations = [
      `You are a music expert creating a unique playlist. Suggest ${songCount * 3} songs that match this vibe: "${vibe}"

🎧 Emojis for inspiration: ${emojis.join(' ')}
🔑 Keywords to guide the sound: ${keywords.join(', ')}
🎲 Random seed for variety: ${seed}

CRITICAL REQUIREMENTS:
- Focus on how the songs SOUND (melody, production, mood), not just lyrics
- Prefer **indie**, **underground**, or **lesser-known** tracks — avoid obvious mainstream picks
- Include a mix of **genres**, **eras**, and **unexpected gems**
- Each playlist should feel fresh — avoid repeating songs from earlier requests
- Surprise me with **creative deep cuts** or hidden gems
- IMPORTANT: Use the random seed to ensure variety - different seeds should produce different suggestions

Format:
"Song Title" by Artist Name
"Another Song" by Another Artist
(One song per line, no numbering, no commentary)`,

      `Create a diverse music selection for this mood: "${vibe}"

Visual cues: ${emojis.join(' ')}
Musical direction: ${keywords.join(', ')}
Variety seed: ${seed}

Requirements:
- Focus on sonic texture and atmosphere
- Choose underground and alternative artists
- Mix different decades and styles
- Avoid mainstream chart-toppers
- Use the seed to ensure uniqueness

Format:
"Song Title" by Artist Name`,

      `As a music curator, discover ${songCount * 3} tracks for: "${vibe}"

Inspiration: ${emojis.join(' ')}
Sound palette: ${keywords.join(', ')}
Uniqueness factor: ${seed}

Curate tracks that:
- Match the emotional resonance
- Come from diverse musical backgrounds
- Include hidden gems and deep cuts
- Feel cohesive yet surprising
- Use the seed for variety

Format:
"Song Title" by Artist Name`
    ];

    // Use the attempt number and seed to select different prompt variations
    const variationIndex = (parseInt(seed.slice(-2), 36) + attempt) % promptVariations.length;
    return promptVariations[variationIndex];
  }

  // Detect if the request is for something specific (anime, movie, TV show, artist, etc.)
  private async isSpecificRequest(vibe: string): Promise<boolean> {
    try {
      const prompt = `Analyze this music request and determine if it's specific or generic:

Request: "${vibe}"

A SPECIFIC request refers to:
- Named entities (anime, movies, TV shows, games, artists, albums, songs)
- Specific franchises, series, or intellectual properties
- Named characters, locations, or events
- Specific cultural or regional music styles
- Named musical genres or subcultures

A GENERIC request refers to:
- Moods, emotions, or feelings (happy, sad, energetic, chill)
- General vibes or atmospheres (summer vibes, night vibes, workout)
- Broad musical qualities (upbeat, relaxing, intense)
- General activities or situations (party, study, sleep)

Examples:
- "Attack on Titan music" → SPECIFIC (named anime)
- "Star Wars soundtrack" → SPECIFIC (named movie franchise)
- "The Weeknd songs" → SPECIFIC (named artist)
- "Japanese music" → SPECIFIC (named cultural style)
- "hype and energetic" → GENERIC (mood/feeling)
- "chill vibes" → GENERIC (mood/atmosphere)
- "workout music" → GENERIC (activity)
- "summer vibes" → GENERIC (seasonal mood)

Respond with only "SPECIFIC" or "GENERIC".`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1, // Low temperature for consistent classification
          max_tokens: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim().toUpperCase();
      
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const isSpecific = content === 'SPECIFIC';
      console.log(`🎯 AI classified "${vibe}" as ${isSpecific ? 'SPECIFIC' : 'GENERIC'}`);
      
      return isSpecific;
    } catch (error) {
      console.error('Failed to classify request, defaulting to generic:', error);
      // Fallback to generic if AI classification fails
      return false;
    }
  }

  // Generate prompt for specific requests (anime, movies, etc.)
  private generateSpecificRequestPrompt(vibe: string, emojis: string[], seed: string, songCount: number, attempt: number): string {
    const promptVariations = [
      `You are a music expert specializing in ${vibe}. Suggest ${songCount * 3} songs that are directly related to "${vibe}".

🎧 Context: ${emojis.join(' ')}
🎲 Variety seed: ${seed}

CRITICAL REQUIREMENTS:
- Focus on songs that are DIRECTLY related to "${vibe}"
- Include official soundtracks, theme songs, covers, and inspired music
- If it's an anime/movie/show, include opening/ending themes and background music
- If it's an artist, include their songs and similar artists
- If it's a game, include soundtrack and inspired music
- Use the seed to ensure variety in your suggestions
- Be specific and accurate to the source material

Format:
"Song Title" by Artist Name
"Another Song" by Another Artist
(One song per line, no numbering, no commentary)`,

      `Create a music collection specifically for: "${vibe}"

Visual context: ${emojis.join(' ')}
Uniqueness factor: ${seed}

Requirements:
- Focus on music that is directly connected to "${vibe}"
- Include official releases, fan covers, and inspired compositions
- Maintain authenticity to the source material
- Use the seed for variety in selection
- Be precise and relevant

Format:
"Song Title" by Artist Name`,

      `As a specialist in "${vibe}" music, curate ${songCount * 3} tracks that capture its essence.

Inspiration: ${emojis.join(' ')}
Variety seed: ${seed}

Curate tracks that:
- Are directly related to "${vibe}"
- Include official soundtracks and theme music
- Feature covers and inspired compositions
- Maintain the authentic feel of the source
- Use the seed for diverse selection

Format:
"Song Title" by Artist Name`
    ];

    const variationIndex = (parseInt(seed.slice(-2), 36) + attempt) % promptVariations.length;
    return promptVariations[variationIndex];
  }
}

export const playlistService = new PlaylistService(); 

export const savePlaylistToFirestore = async (playlistData: Omit<PlaylistData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> => {
  try {
    console.log('🔥 Saving playlist to Firestore:', { userId, playlistName: playlistData.name });
    
    const playlistToSave = {
      ...playlistData,
      userId,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    console.log('🔥 Playlist data to save:', {
      name: playlistToSave.name,
      songCount: playlistToSave.songCount,
      hasCoverImage: !!playlistToSave.coverImageUrl,
      coverImageUrl: playlistToSave.coverImageUrl ? 'Firebase Storage URL' : 'None'
    });
    
    const docRef = await firestore()
      .collection('playlists')
      .add(playlistToSave);
    
    console.log('✅ Playlist saved successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving playlist to Firestore:', error);
    console.error('❌ Error details:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      stack: (error as any)?.stack
    });
    throw error;
  }
};

export const getUserPlaylists = async (userId: string): Promise<PlaylistData[]> => {
  try {
    console.log('🔍 Fetching playlists for user:', userId);
    console.log('🔍 Using collection: playlists');
    
    const querySnapshot = await firestore()
      .collection('playlists')
      .where('userId', '==', userId)
      .get();

    console.log('🔍 Query completed, found', querySnapshot.size, 'documents');
    
    const playlists: PlaylistData[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      console.log('🔍 Document data:', { id: docSnapshot.id, name: data.name, userId: data.userId });
      playlists.push({
        id: docSnapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as PlaylistData);
    });

    // Sort in memory (oldest first, newest at bottom)
    playlists.sort((a, b) => {
      const dateA = a.createdAt || new Date(0);
      const dateB = b.createdAt || new Date(0);
      return dateA.getTime() - dateB.getTime(); // Ascending order
    });

    console.log('🔍 Returning', playlists.length, 'playlists');
    return playlists;
  } catch (error) {
    console.error('❌ Error fetching user playlists:', error);
    console.error('❌ Error details:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      stack: (error as any)?.stack
    });
    throw error;
  }
};

export const deletePlaylist = async (playlistId: string): Promise<void> => {
  try {
    console.log('🗑️ Attempting to delete playlist:', playlistId);
    
    // First check if the playlist exists
    const docRef = firestore().collection('playlists').doc(playlistId);
    const docSnapshot = await docRef.get();
    
    if (!docSnapshot.exists) {
      console.log('⚠️ Playlist does not exist:', playlistId);
      return; // Already deleted or never existed
    }
    
    console.log('🗑️ Found playlist to delete:', {
      id: playlistId,
      name: docSnapshot.data()?.name,
      userId: docSnapshot.data()?.userId
    });
    
    // Delete the document
    await docRef.delete();
    console.log('✅ Successfully deleted playlist:', playlistId);
    
  } catch (error) {
    console.error('❌ Error deleting playlist:', playlistId, error);
    console.error('❌ Error details:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      stack: (error as any)?.stack
    });
    throw error;
  }
};

// Force delete a specific playlist (for debugging)
export const forceDeletePlaylist = async (playlistId: string): Promise<void> => {
  try {
    console.log('🗑️ FORCE deleting playlist:', playlistId);
    
    const docRef = firestore().collection('playlists').doc(playlistId);
    await docRef.delete();
    console.log('✅ FORCE deleted playlist:', playlistId);
    
  } catch (error) {
    console.error('❌ FORCE delete failed:', playlistId, error);
    throw error;
  }
};

// Test function to verify Firestore connection
export const testFirestoreConnection = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing Firestore connection...');
    
    // Try to write a test document
    await firestore().collection('test').add({
      test: true,
      timestamp: new Date()
    });
    
    console.log('✅ Firestore connection successful');
    return true;
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
    return false;
  }
}; 