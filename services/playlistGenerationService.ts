import { OPENAI_API_KEY } from '../env';
import { spotifyService } from './spotify';
import { 
  PlaylistData, 
  SpotifyTrack, 
  PlaylistProgress, 
  PlaylistInfo
} from './types/playlistTypes';
import { uploadImageFromUrlToStorage, isFirebaseStorageUrl, uploadBase64ImageToStorage } from './storageService';

export class PlaylistGenerationService {
  private playlistCache = new Map<string, {playlist: PlaylistData, timestamp: number}>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  /**
   * Try to parse a JSON object out of an LLM text response.
   */
  private tryParseJsonFromText(text: string): any {
    if (!text) throw new Error('Empty response');
    let cleaned = text.trim();
    // Strip code fences
    cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```/g, '');
    // Try to find the first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      cleaned = match[0];
    }
    // Remove leading/trailing quotes
    cleaned = cleaned.replace(/^[`'\"]+/, '').replace(/[`'\"]+$/, '');
    return JSON.parse(cleaned);
  }

  /**
   * Main playlist generation method with optional streaming support
   */
  async generatePlaylist(
    emojis: string[],
    songCount: number,
    vibe: string,
    options?: {
      streaming?: boolean;
      onProgress?: (playlist: Partial<PlaylistData>, progress: PlaylistProgress) => void;
      bypassCache?: boolean;
    }
  ): Promise<PlaylistData> {
    // Handle backward compatibility
    if (!options) {
      options = {};
    }
    
    console.log('🎵 Generating playlist:', { emojis, vibe, songCount, streaming: options.streaming });
    
    // Check cache first (unless bypassed)
    const useCache = !options.bypassCache;
    const cached = useCache ? null : null;
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
    
    // Do not cache to ensure uniqueness across sessions
    
    return playlist;
  }

  /**
   * Backward compatibility method for the old API without options
   */
  async generatePlaylistLegacy(
    emojis: string[],
    songCount: number,
    vibe: string
  ): Promise<PlaylistData> {
    console.log('🎵 Using backward compatibility method generatePlaylistLegacy');
    return this.generatePlaylist(emojis, songCount, vibe, {});
  }

  /**
   * Backward compatibility method for the old streaming API
   */
  async generatePlaylistStreaming(
    emojis: string[],
    songCount: number,
    vibe: string,
    onProgress?: (playlist: Partial<PlaylistData>, progress: PlaylistProgress) => void
  ): Promise<PlaylistData> {
    console.log('🎵 Using backward compatibility method generatePlaylistStreaming');
    return this.generatePlaylist(emojis, songCount, vibe, {
      streaming: true,
      onProgress
    });
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
      let coverImageUrl = await this.generateCoverImage(emojis, vibe, playlistInfo.colorPalette);
      // Persist cover to Firebase Storage for non-expiring URL
      try {
        if (coverImageUrl && !isFirebaseStorageUrl(coverImageUrl)) {
          const tempId = this.generateUniquePlaylistId();
          const storedUrl = await uploadImageFromUrlToStorage(`covers/generated/${tempId}.jpg`, coverImageUrl);
          coverImageUrl = storedUrl;
        }
      } catch (e) {
        console.warn('Failed to persist cover image to storage, keeping original URL:', e);
      }
      
      // Generate tracks
      options.onProgress?.({ emojis, songCount, vibe, ...playlistInfo, coverImageUrl }, { current: 2, total: songCount, phase: 'Generating tracks...' });
      const tracks = await this.generateTracks(emojis, songCount, vibe, playlistInfo.keywords, options);
      
      // Validate and finalize
      const finalTracks = this.validatePlaylist(tracks, songCount);
      
      const playlist: PlaylistData = {
        id: this.generateUniquePlaylistId(),
        name: playlistInfo.name,
        description: playlistInfo.description,
        colorPalette: playlistInfo.colorPalette,
        keywords: playlistInfo.keywords,
        coverImageUrl,
        emojis,
        songCount,
        vibe,
        tracks: finalTracks,
        isSpotifyPlaylist: false,
        createdAt: new Date(),
        updatedAt: new Date()
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
   * Generate playlist metadata using AI (keeping your existing prompts)
   */
  private async generatePlaylistInfo(emojis: string[], vibe: string): Promise<PlaylistInfo> {
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
- Specific musical terms (e.g., "guitar", "piano", "synth", "drums")`;
    }

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
          temperature: 0.3,
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
        const parsed = this.tryParseJsonFromText(content);
        const result: PlaylistInfo = {
          name: parsed.name || 'vibes',
          description: parsed.description || 'A carefully curated musical journey.',
          colorPalette: parsed.colorPalette || ['#6366f1', '#8b5cf6', '#a855f7'],
          keywords: isSpecific ? [] : (parsed.keywords || ['indie', 'atmospheric', 'vibes']),
        };
        return result;
      } catch (error) {
        console.error('Failed to parse playlist info:', error);
        
        const fallback: PlaylistInfo = {
          name: 'vibes',
          description: 'A carefully curated musical journey.',
          colorPalette: ['#6366f1', '#8b5cf6', '#a855f7'],
          keywords: isSpecific ? [] : ['indie', 'atmospheric', 'vibes'],
        };
        
        return fallback;
      }
    } catch (error) {
      console.error('Failed to generate playlist info:', error);
      
      const fallback: PlaylistInfo = {
        name: 'vibes',
        description: 'A carefully curated musical journey.',
        colorPalette: ['#6366f1', '#8b5cf6', '#a855f7'],
        keywords: isSpecific ? [] : ['indie', 'atmospheric', 'vibes'],
      };
      
      return fallback;
    }
  }

  /**
   * Generate cover image using AI (keeping your existing DALL-E prompt)
   */
  private async generateCoverImage(emojis: string[], vibe: string, colorPalette: string[]): Promise<string> {
    try {
      if (!OPENAI_API_KEY) {
        console.warn('🎨 OpenAI API key not configured, skipping cover image generation');
        return '';
      }
      
      const colorString = colorPalette.join(', ');
      const emojiString = emojis.join(' ');
      
      const isSpecific = await this.isSpecificRequest(vibe);
    
      let prompt: string;
    
      if (isSpecific) {
        const artisticPrompt = await this.generateArtisticPromptFromSpecificRequest(vibe, colorString);
        prompt = artisticPrompt;
      } else {
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

      // First try requesting base64 so we can upload directly and avoid ephemeral URLs
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
          size: '1024x1024',
          quality: 'standard',
          style: 'natural',
          response_format: 'b64_json',
        }),
      });

      if (!response.ok) {
        let errorDetails = response.statusText;
        try {
          const errorBody = await response.json();
          if (errorBody.error) {
            errorDetails = `${errorBody.error.message || errorBody.error} (${response.status})`;
          } else if (errorBody.message) {
            errorDetails = `${errorBody.message} (${response.status})`;
          }
        } catch (parseError) {
          errorDetails = `${response.statusText || 'Unknown error'} (${response.status})`;
        }
        
        throw new Error(`DALL-E API error: ${errorDetails}`);
      }

      const data = await response.json();
      const b64 = data.data?.[0]?.b64_json;
      if (b64) {
        try {
          const tempId = this.generateUniquePlaylistId();
          const storedUrl = await uploadBase64ImageToStorage(`covers/generated/${tempId}.png`, b64, 'image/png');
          return storedUrl;
        } catch (e) {
          console.warn('Failed to upload base64 image to storage, will fall back to URL flow:', e);
        }
      }

      // Fallback: request URL format and then copy to storage
      const urlResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          style: 'natural',
          response_format: 'url',
        }),
      });

      if (!urlResponse.ok) {
        let errorDetails = urlResponse.statusText;
        try {
          const errorBody = await urlResponse.json();
          if (errorBody.error) {
            errorDetails = `${errorBody.error.message || errorBody.error} (${urlResponse.status})`;
          } else if (errorBody.message) {
            errorDetails = `${errorBody.message} (${urlResponse.status})`;
          }
        } catch (parseError) {
          errorDetails = `${urlResponse.statusText || 'Unknown error'} (${urlResponse.status})`;
        }
        throw new Error(`DALL-E API error (fallback URL): ${errorDetails}`);
      }

      const urlData = await urlResponse.json();
      const imageUrl = urlData.data?.[0]?.url;
      if (!imageUrl) {
        console.warn('🎨 No image URL received from DALL-E (fallback)');
        return '';
      }

      try {
        const tempId = this.generateUniquePlaylistId();
        const storedUrl = await uploadImageFromUrlToStorage(`covers/generated/${tempId}.jpg`, imageUrl);
        return storedUrl;
      } catch (e) {
        console.warn('Failed to persist URL image to storage, returning original (ephemeral) URL:', e);
        return imageUrl;
      }
      
    } catch (error) {
      console.error('🎨 DALL-E image generation failed:', error);
      return '';
    }
  }

  /**
   * Public helper to regenerate and persist a cover image for an existing playlist.
   */
  async regenerateAndPersistCoverImage(
    userId: string,
    playlistId: string,
    emojis: string[],
    vibe: string,
    colorPalette: string[]
  ): Promise<string> {
    const url = await this.generateCoverImage(emojis, vibe, colorPalette);
    if (!url) return '';
    try {
      const storedUrl = await uploadImageFromUrlToStorage(`covers/users/${userId}/${playlistId}.jpg`, url);
      return storedUrl;
    } catch (e) {
      console.warn('Failed to upload regenerated cover image to storage:', e);
      return url; // fallback to original (may be ephemeral)
    }
  }

  /**
   * Generate artistic prompt for specific requests (keeping your existing method)
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

Respond with ONLY a brief artistic description (2-3 sentences) that captures the essence without any copyrighted references. Focus on the emotional and visual qualities that would make compelling album artwork.`;

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

  /**
   * Generate tracks using AI and Spotify search (keeping your existing approach)
   */
  private async generateTracks(
    emojis: string[], 
    songCount: number, 
    vibe: string, 
    keywords: string[],
    options: { streaming?: boolean; onProgress?: (playlist: Partial<PlaylistData>, progress: PlaylistProgress) => void }
  ): Promise<SpotifyTrack[]> {
    console.log('🎵 Generating tracks for:', { emojis, vibe, songCount, keywords });
    
    const usedTrackIds = new Set<string>();
    const tracks: SpotifyTrack[] = [];
    // Add extra entropy to always vary suggestions even with same inputs
    const seed = this.generatePlaylistSeed(emojis, `${vibe}-${Date.now()}-${Math.random()}`, songCount);
    
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
   * Generate song suggestions using AI (keeping your existing prompts)
   */
  private async generateSongSuggestions(
    emojis: string[], 
    vibe: string, 
    songCount: number, 
    keywords: string[], 
    seed: string
  ): Promise<Array<{title: string, artist: string}>> {
    const isSpecific = await this.isSpecificRequest(vibe);
    let prompt: string;
    
    if (isSpecific) {
      // Use your existing specific request prompt
      prompt = `You are a music expert specializing in ${vibe}. Suggest ${songCount * 3} songs that are directly related to "${vibe}".

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
(One song per line, no numbering, no commentary)`;
    } else {
      // Use your existing varied prompt
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

      const variationIndex = parseInt(seed.slice(-2), 36) % promptVariations.length;
      prompt = promptVariations[variationIndex];
    }

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
      
      return suggestions;
      
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
      console.log('Testing Spotify service connectivity...');
      
      const isAuth = await spotifyService.isAuthenticated();
      console.log(`Spotify authenticated: ${isAuth}`);
      
      if (!isAuth) {
        console.error('Spotify not authenticated');
        return false;
      }
      
      console.log('Spotify service is working - using search-based discovery');
      return true;
    } catch (error) {
      console.error('Spotify service test failed:', error);
      return false;
    }
  }

  /**
   * Generate a unique playlist ID (keeping your existing method)
   */
  private generateUniquePlaylistId(): string {
    // Generate a truly unique ID using multiple sources of randomness (React Native compatible)
    const timestamp = Date.now();
    const performanceTime = performance.now();
    const randomString1 = Math.random().toString(36).substring(2, 15);
    const randomString2 = Math.random().toString(36).substring(2, 15);
    const randomString3 = Math.random().toString(36).substring(2, 15);
    const randomString4 = Math.random().toString(36).substring(2, 15);
    
    // Create additional entropy using process.hrtime if available, otherwise use more random strings
    let processTime = '';
    try {
      if (typeof process !== 'undefined' && process.hrtime) {
        const hrtime = process.hrtime();
        processTime = `${hrtime[0]}-${hrtime[1]}`;
      } else {
        processTime = `${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 10)}`;
      }
    } catch (e) {
      processTime = `${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 10)}`;
    }
    
    // Combine all sources for maximum uniqueness
    const uniqueId = `${timestamp}-${performanceTime.toString(36)}-${randomString1}-${randomString2}-${randomString3}-${randomString4}-${processTime}`;
    
    // Ensure the ID is URL-safe and not too long
    const finalId = uniqueId.replace(/[^a-zA-Z0-9\-]/g, '').substring(0, 100);
    
    console.log('🆔 Generated unique playlist ID:', finalId);
    return finalId;
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
   * Check if request is specific (keeping your existing method)
   */
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
          temperature: 0.1,
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
      return false;
    }
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