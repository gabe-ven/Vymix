import { OPENAI_API_KEY } from '../env';
import { spotifyService } from './spotify';
import { 
  PlaylistData, 
  SpotifyTrack, 
  PlaylistProgress, 
  PlaylistInfo, 
  SongSuggestion 
} from './types/playlistTypes';

export class PlaylistGenerationService {
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generatePlaylist(
    emojis: string[],
    songCount: number,
    vibe: string
  ): Promise<PlaylistData> {
    console.log('🎵 Generating playlist:', { emojis, songCount, vibe });

    const baseTimeout = 120000; // 2 minutes base
    const perSongTimeout = 3000; // 3 seconds per song
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
      const userMessage = this.getSpotifyErrorMessage(error);
      throw new Error(userMessage);
    }
  }

  async generatePlaylistStreaming(
    emojis: string[],
    songCount: number,
    vibe: string,
    onProgress?: (playlist: Partial<PlaylistData>, progress: PlaylistProgress) => void
  ): Promise<PlaylistData> {
    console.log('🎵 Generating playlist with streaming:', { emojis, songCount, vibe });

    const baseTimeout = 120000;
    const perSongTimeout = 3000;
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
      const userMessage = this.getSpotifyErrorMessage(error);
      throw new Error(userMessage);
    }
  }

  private async _generatePlaylist(
    emojis: string[],
    songCount: number,
    vibe: string
  ): Promise<PlaylistData> {
    const playlistInfo = await this.generatePlaylistInfo(emojis, vibe);
    const coverImageUrl = await this.generateCoverImage(emojis, vibe, playlistInfo.colorPalette).catch(() => undefined);
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

  private async _generatePlaylistStreaming(
    emojis: string[],
    songCount: number,
    vibe: string,
    onProgress?: (playlist: Partial<PlaylistData>, progress: PlaylistProgress) => void
  ): Promise<PlaylistData> {
    try {
      console.log('🎵 Generating playlist with streaming for:', { emojis, songCount, vibe });
      
      onProgress?.({}, { current: 1, total: 4, phase: 'Generating playlist info...' });
      const playlistInfo = await this.generatePlaylistInfo(emojis, vibe);
      
      onProgress?.({ ...playlistInfo }, { current: 2, total: 4, phase: 'Generating cover image...' });
      let coverImageUrl = '';
      try {
        coverImageUrl = await this.generateCoverImage(emojis, vibe, playlistInfo.colorPalette);
      } catch (coverError) {
        console.error('🎵 Cover image generation failed:', coverError);
        coverImageUrl = '';
      }
      
      onProgress?.({ ...playlistInfo, coverImageUrl }, { current: 3, total: 4, phase: 'Finding songs...' });
      const tracks = await this.generateTracksStreaming(emojis, songCount, vibe, playlistInfo.keywords, onProgress);
      
      onProgress?.({ ...playlistInfo, coverImageUrl, tracks }, { current: 4, total: 4, phase: 'Finalizing playlist...' });
      
      const playlist: PlaylistData = {
        name: playlistInfo.name,
        description: playlistInfo.description,
        colorPalette: playlistInfo.colorPalette,
        keywords: playlistInfo.keywords,
        coverImageUrl,
        emojis,
        songCount,
        vibe,
        tracks,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      return playlist;
    } catch (error) {
      console.error('🎵 Error in playlist generation:', error);
      throw error;
    }
  }

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
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    try {
      let cleanedContent = content.trim();
      cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      cleanedContent = cleanedContent.replace(/^[`'\"]+/, '').replace(/[`'\"]+$/, '');
      
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
      }
      
      const parsed = JSON.parse(cleanedContent);
      
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid response format - expected object');
      }
      
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
  }

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
          response_format: 'url',
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
      const imageUrl = data.data?.[0]?.url;
      
      if (!imageUrl) {
        console.warn('🎨 No image URL received from DALL-E');
        return '';
      }

      return imageUrl;
      
    } catch (error) {
      console.error('🎨 DALL-E image generation failed:', error);
      return '';
    }
  }

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

  private async generateTracks(
    emojis: string[], 
    songCount: number, 
    vibe: string, 
    keywords: string[]
  ): Promise<SpotifyTrack[]> {
    console.log('🎵 Generating tracks for:', { emojis, vibe, songCount, keywords });
    
    const spotifyWorking = await this.testSpotifyService();
    if (!spotifyWorking) {
      throw new Error('Spotify service is not available. Please check your connection and authentication.');
    }
    
    const playlistSeed = this.generatePlaylistSeed(emojis, vibe, songCount);
    console.log('🎲 Generated playlist seed:', playlistSeed);
    
    const isSpecific = await this.isSpecificRequest(vibe);
    if (isSpecific) {
      console.log('🎯 Detected specific request, focusing on source material directly');
      const tracks = await this.generateTracksWithAI(emojis, songCount, vibe, [], playlistSeed);
      return tracks;
    } else {
      const tracks = await this.generateTracksWithAI(emojis, songCount, vibe, keywords, playlistSeed);
      return tracks;
    }
  }

  private async generateTracksStreaming(
    emojis: string[], 
    songCount: number, 
    vibe: string, 
    keywords: string[],
    onProgress?: (playlist: Partial<PlaylistData>, progress: PlaylistProgress) => void
  ): Promise<SpotifyTrack[]> {
    console.log('🎵 Generating tracks with streaming for:', { emojis, vibe, songCount, keywords });
    
    const spotifyWorking = await this.testSpotifyService();
    if (!spotifyWorking) {
      throw new Error('Spotify service is not available. Please check your connection and authentication.');
    }
    
    const playlistSeed = this.generatePlaylistSeed(emojis, vibe, songCount);
    console.log('🎲 Generated playlist seed:', playlistSeed);
    
    const isSpecific = await this.isSpecificRequest(vibe);
    if (isSpecific) {
      console.log('🎯 Detected specific request, focusing on source material directly');
      onProgress?.({ 
        emojis, 
        songCount, 
        vibe,
        tracks: []
      }, { current: 0, total: songCount, phase: 'Starting AI track generation...' });
      
      const tracks = await this.generateTracksWithAIStreaming(emojis, songCount, vibe, [], playlistSeed, onProgress);
      return tracks;
    } else {
      onProgress?.({ 
        emojis, 
        songCount, 
        vibe,
        tracks: []
      }, { current: 0, total: songCount, phase: 'Starting AI track generation...' });
      
      const tracks = await this.generateTracksWithAIStreaming(emojis, songCount, vibe, keywords, playlistSeed, onProgress);
      return tracks;
    }
  }

  private async generateTracksWithAI(
    emojis: string[], 
    songCount: number, 
    vibe: string, 
    keywords: string[],
    seed: string
  ): Promise<SpotifyTrack[]> {
    console.log('🤖 Generating tracks for:', { emojis, vibe, songCount });
    
    const usedTrackIds = new Set<string>();
    const tracks: SpotifyTrack[] = [];
    let attempts = 0;
    const maxAttempts = 5;
    
    while (tracks.length < songCount && attempts < maxAttempts) {
      attempts++;
      console.log(`🎯 Attempt ${attempts}: Need ${songCount - tracks.length} more songs`);
      
      const isSpecific = await this.isSpecificRequest(vibe);
      const remainingSongs = songCount - tracks.length;
      const prompt = isSpecific 
        ? this.generateSpecificRequestPrompt(vibe, emojis, seed, remainingSongs, attempts)
        : this.generateVariedPrompt(emojis, vibe, keywords, seed, remainingSongs, attempts);

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
          throw new Error('No response from OpenAI');
        }

        const lines = content.split('\n').filter((line: string) => line.trim().length > 0);
        const suggestions: SongSuggestion[] = [];
        
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
        
        for (const suggestion of suggestions) {
          if (tracks.length >= songCount) break;
          
          try {
            const searchQuery = this.createValidSearchQuery(suggestion.title, suggestion.artist, isSpecific);
            const selectedTrack = await this.searchWithVariety(searchQuery, usedTrackIds, tracks, isSpecific);
            
            if (selectedTrack) {
              tracks.push(selectedTrack);
              usedTrackIds.add(selectedTrack.id);
              console.log(`✅ Found: "${selectedTrack.name}" by ${selectedTrack.artists.map(a => a.name).join(', ')} (${tracks.length}/${songCount})`);
            }
            
            await this.delay(100);
          } catch (error) {
            console.warn(`Search failed for "${suggestion.title}":`, error);
          }
        }
        
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

  private async generateTracksWithAIStreaming(
    emojis: string[], 
    songCount: number, 
    vibe: string, 
    keywords: string[],
    seed: string,
    onProgress?: (playlist: Partial<PlaylistData>, progress: PlaylistProgress) => void
  ): Promise<SpotifyTrack[]> {
    console.log('🤖 Generating tracks with streaming for:', { emojis, vibe, songCount });
    
    const usedTrackIds = new Set<string>();
    const tracks: SpotifyTrack[] = [];
    let attempts = 0;
    const maxAttempts = 5;
    
    while (tracks.length < songCount && attempts < maxAttempts) {
      attempts++;
      console.log(`🎯 Attempt ${attempts}: Need ${songCount - tracks.length} more songs`);
      
      if (attempts === 1) {
        onProgress?.({ tracks: [...tracks] }, { current: tracks.length, total: songCount, phase: 'Generating songs...' });
      }
      
      const isSpecific = await this.isSpecificRequest(vibe);
      const remainingSongs = songCount - tracks.length;
      const prompt = isSpecific 
        ? this.generateSpecificRequestPrompt(vibe, emojis, seed, remainingSongs, attempts)
        : this.generateVariedPrompt(emojis, vibe, keywords, seed, remainingSongs, attempts);

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
          throw new Error('No response from OpenAI');
        }

        const lines = content.split('\n').filter((line: string) => line.trim().length > 0);
        const suggestions: SongSuggestion[] = [];
        
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
        
        for (const suggestion of suggestions) {
          if (tracks.length >= songCount) break;
          
          try {
            const searchQuery = this.createValidSearchQuery(suggestion.title, suggestion.artist, isSpecific);
            const selectedTrack = await this.searchWithVariety(searchQuery, usedTrackIds, tracks, isSpecific);
            
            if (selectedTrack) {
              tracks.push(selectedTrack);
              usedTrackIds.add(selectedTrack.id);
              console.log(`✅ Found: "${selectedTrack.name}" by ${selectedTrack.artists.map(a => a.name).join(', ')} (${tracks.length}/${songCount})`);
              
              onProgress?.({ tracks: [...tracks] }, { current: tracks.length, total: songCount, phase: `Found ${tracks.length} of ${songCount} songs...` });
            }
            
            await this.delay(100);
          } catch (error) {
            console.warn(`Search failed for "${suggestion.title}":`, error);
          }
        }
        
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

  private generatePlaylistSeed(emojis: string[], vibe: string, songCount: number): string {
    const timestamp = Date.now();
    const emojiHash = emojis.join('').split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const vibeHash = vibe.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    
    const randomFactor1 = Math.random() * 1000000;
    const randomFactor2 = Math.random() * 1000000;
    const randomFactor3 = Math.random() * 1000000;
    
    const microTime = performance.now();
    const processRandom = Math.random() * 1000000;
    
    const seed = `${timestamp}-${microTime}-${emojiHash}-${vibeHash}-${songCount}-${randomFactor1}-${randomFactor2}-${randomFactor3}-${processRandom}`;
    const seedHash = this.hashString(seed);
    
    return `${seedHash}-${timestamp}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

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

    const variationIndex = (parseInt(seed.slice(-2), 36) + attempt) % promptVariations.length;
    return promptVariations[variationIndex];
  }

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

  private createValidSearchQuery(title: string, artist: string, isSpecific: boolean = false): string {
    if (isSpecific) {
      const cleanArtist = artist.trim().replace(/[^\w\s\-'&]/g, '').substring(0, 100);
      
      let searchQuery = cleanArtist;
      
      const cleanTitle = title.trim().replace(/[^\w\s\-'&]/g, '').substring(0, 50);
      if (cleanTitle && cleanTitle.length > 2 && !cleanTitle.toLowerCase().includes('song') && !cleanTitle.toLowerCase().includes('track')) {
        searchQuery = `${cleanTitle} ${cleanArtist}`;
      }
      
      if (searchQuery.length > 240) {
        searchQuery = cleanArtist.substring(0, 240);
      }
      
      return searchQuery;
    } else {
      const cleanTitle = title.trim().replace(/[^\w\s\-'&]/g, '').substring(0, 50);
      const cleanArtist = artist.trim().replace(/[^\w\s\-'&]/g, '').substring(0, 50);
      
      let searchQuery = `${cleanTitle} ${cleanArtist}`;
      
      if (searchQuery.length > 240) {
        const artistFirstWord = cleanArtist.split(' ')[0];
        searchQuery = `${cleanTitle} ${artistFirstWord}`;
        
        if (searchQuery.length > 240) {
          const maxTitleLength = 240 - artistFirstWord.length - 1;
          searchQuery = `${cleanTitle.substring(0, maxTitleLength)} ${artistFirstWord}`;
        }
      }
      
      return searchQuery;
    }
  }

  private getRandomSearchOffset(): number {
    return Math.floor(Math.random() * 20);
  }

  private async searchWithVariety(query: string, usedTrackIds: Set<string>, existingTracks: SpotifyTrack[], isSpecific: boolean = false): Promise<SpotifyTrack | null> {
    const maxRetries = 3;
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const searchQuery = this.createValidSearchQuery(query, '', isSpecific);
        const offset = this.getRandomSearchOffset();
        
        if (attempt === 1) {
          console.log(`🎯 Searching for: "${searchQuery}"`);
        } else {
          console.log(`🎯 Retry ${attempt}/${maxRetries} for: "${searchQuery}"`);
        }
        
        const searchResponse = await spotifyService.search(searchQuery, ['track'], 10, offset);

        if (searchResponse.tracks.items.length === 0) {
          return null;
        }

        for (const track of searchResponse.tracks.items) {
          if (!usedTrackIds.has(track.id)) {
            console.log(`✅ Found: "${track.name}" by ${track.artists.map((a: any) => a.name).join(', ')}`);
            return track;
          }
        }

        return null;
        
      } catch (error) {
        lastError = error;
        
        if (error instanceof Error && error.message.includes('502') && attempt < maxRetries) {
          console.log(`🎯 502 error, retrying...`);
          await this.delay(attempt * 2000);
          continue;
        }
        
        break;
      }
    }
    
    console.warn(`Search failed for "${query}" after ${maxRetries} attempts`);
    return null;
  }

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

  private async checkSpotifyAuth(): Promise<boolean> {
    try {
      const isAuth = await spotifyService.isAuthenticated();
      if (!isAuth) {
        console.error('Spotify authentication check failed');
        return false;
      }
      
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

  private async testSpotifyService(): Promise<boolean> {
    try {
      console.log('Testing Spotify service connectivity...');
      
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
      return false;
    }
  }
}

export const playlistGenerationService = new PlaylistGenerationService(); 