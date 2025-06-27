import { spotifyService } from './spotify';
import { OPENAI_API_KEY } from '../env';
import { MOOD_EMOJIS, ALL_MOOD_EMOJIS } from '../app/constants/emojis';

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

// Dynamic Emoji Analysis System
class EmojiAnalyzer {
  // Comprehensive mood-to-music mapping
  private static readonly MOOD_TO_MUSIC_MAPPING = {
    happy: {
      genres: ['indie-pop', 'dream-pop', 'shoegaze', 'power-pop', 'sunshine-pop'],
      vibes: ['uplifting', 'energetic', 'bright', 'optimistic'],
      cultural: ['morning acoustic', 'sunshine indie', 'daylight pop', 'summer vibes'],
      audioFeatures: { min_energy: 0.6, max_energy: 1.0, min_valence: 0.6, max_valence: 1.0 }
    },
    calm: {
      genres: ['ambient', 'chillwave', 'downtempo', 'neo-classical', 'minimal'],
      vibes: ['relaxed', 'peaceful', 'serene', 'meditative'],
      cultural: ['foggy forest ambient', 'morning coffee acoustic', 'candlelight indie', 'zen meditation'],
      audioFeatures: { min_energy: 0.0, max_energy: 0.4, min_valence: 0.3, max_valence: 0.7 }
    },
    love: {
      genres: ['dream-pop', 'indie-folk', 'neo-soul', 'romantic-pop', 'intimate-acoustic'],
      vibes: ['romantic', 'intimate', 'warm', 'tender'],
      cultural: ['cafe romance acoustic', 'starry night dream pop', 'intimate piano ballads', 'sunset beach folk'],
      audioFeatures: { min_energy: 0.2, max_energy: 0.7, min_valence: 0.4, max_valence: 0.8 }
    },
    sad: {
      genres: ['ambient', 'post-rock', 'neo-classical', 'dream-pop', 'shoegaze'],
      vibes: ['melancholy', 'nostalgic', 'distant', 'introspective'],
      cultural: ['rainy day lo-fi', 'midnight bedroom pop', 'winter ambient field recordings', 'lonely city jazz'],
      audioFeatures: { min_energy: 0.0, max_energy: 0.5, min_valence: 0.0, max_valence: 0.3 }
    },
    angry: {
      genres: ['post-hardcore', 'math-rock', 'noise-rock', 'experimental', 'industrial'],
      vibes: ['intense', 'chaotic', 'aggressive', 'raw'],
      cultural: ['underground warehouse noise', 'industrial chaos', 'math rock complexity', 'experimental distortion'],
      audioFeatures: { min_energy: 0.7, max_energy: 1.0, min_valence: 0.0, max_valence: 0.4 }
    },
    confused: {
      genres: ['experimental', 'avant-garde', 'ambient', 'post-rock', 'math-rock'],
      vibes: ['disorienting', 'surreal', 'abstract', 'unpredictable'],
      cultural: ['experimental soundscapes', 'avant-garde composition', 'surreal ambient', 'abstract noise'],
      audioFeatures: { min_energy: 0.1, max_energy: 0.8, min_valence: 0.1, max_valence: 0.6 }
    },
    excited: {
      genres: ['dance-punk', 'electroclash', 'synthwave', 'indie-dance', 'new-rave'],
      vibes: ['energetic', 'euphoric', 'celebratory', 'dynamic'],
      cultural: ['cyberpunk club night', 'underground warehouse techno', 'neon city synthwave', 'late night garage rock'],
      audioFeatures: { min_energy: 0.6, max_energy: 1.0, min_danceability: 0.5, max_danceability: 1.0 }
    },
    dreamy: {
      genres: ['dream-pop', 'shoegaze', 'ambient', 'space-rock', 'ethereal'],
      vibes: ['ethereal', 'floating', 'otherworldly', 'hypnotic'],
      cultural: ['lunar soundscapes', 'cosmic ambient', 'ethereal dreamscapes', 'space rock journey'],
      audioFeatures: { min_energy: 0.1, max_energy: 0.6, min_acousticness: 0.2, max_acousticness: 0.8 }
    },
    nostalgic: {
      genres: ['retro-pop', 'vintage-synth', 'neo-80s', 'analog-electronic', 'tape-loops'],
      vibes: ['retro', 'vintage', 'memory-lane', 'analog'],
      cultural: ['vintage synthwave', 'retro cassette vibes', '80s nostalgia', 'analog warmth'],
      audioFeatures: { min_energy: 0.2, max_energy: 0.7, min_acousticness: 0.1, max_acousticness: 0.6 }
    },
    nature: {
      genres: ['ambient', 'folk', 'neo-classical', 'organic-electronic', 'field-recordings'],
      vibes: ['organic', 'natural', 'earthy', 'peaceful'],
      cultural: ['forest ambient', 'organic folk', 'nature field recordings', 'earthy acoustic'],
      audioFeatures: { min_energy: 0.0, max_energy: 0.5, min_acousticness: 0.3, max_acousticness: 0.9 }
    },
    weather: {
      genres: ['ambient', 'post-rock', 'atmospheric', 'drone', 'soundscape'],
      vibes: ['atmospheric', 'dynamic', 'seasonal', 'moody'],
      cultural: ['storm ambient', 'weather field recordings', 'atmospheric soundscapes', 'seasonal moods'],
      audioFeatures: { min_energy: 0.0, max_energy: 0.7, min_acousticness: 0.2, max_acousticness: 0.8 }
    },
    mysterious: {
      genres: ['dark-ambient', 'drone', 'experimental', 'occult-rock', 'witch-house'],
      vibes: ['eerie', 'spiritual', 'hidden', 'mysterious'],
      cultural: ['dark ambient ritual', 'occult soundscapes', 'mysterious drone', 'spiritual experimental'],
      audioFeatures: { min_energy: 0.0, max_energy: 0.5, min_valence: 0.0, max_valence: 0.4 }
    },
    cozy: {
      genres: ['ambient', 'indie-folk', 'neo-classical', 'warm-acoustic', 'home-recording'],
      vibes: ['warm', 'comforting', 'intimate', 'homely'],
      cultural: ['home recording', 'bedroom pop', 'domestic ambient', 'warm acoustic'],
      audioFeatures: { min_energy: 0.0, max_energy: 0.4, min_acousticness: 0.4, max_acousticness: 0.9 }
    }
  };

  // Analyze emojis and return comprehensive music mapping
  static analyzeEmojis(emojis: string[]): {
    primaryMood: string;
    secondaryMoods: string[];
    genres: string[];
    vibes: string[];
    culturalTerms: string[];
    audioFeatures: any;
  } {
    // Count emoji occurrences by mood
    const moodCounts: { [mood: string]: number } = {};
    
    emojis.forEach(emoji => {
      for (const [mood, moodEmojis] of Object.entries(MOOD_EMOJIS)) {
        if (moodEmojis.includes(emoji)) {
          moodCounts[mood] = (moodCounts[mood] || 0) + 1;
        }
      }
    });

    // Find primary and secondary moods
    const sortedMoods = Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([mood]) => mood);

    const primaryMood = sortedMoods[0] || 'calm';
    const secondaryMoods = sortedMoods.slice(1, 3);

    // Combine music mappings from all moods
    const allGenres = new Set<string>();
    const allVibes = new Set<string>();
    const allCulturalTerms = new Set<string>();
    const audioFeatures: { [key: string]: { sum: number; count: number } } = {};

    [primaryMood, ...secondaryMoods].forEach(mood => {
      const mapping = this.MOOD_TO_MUSIC_MAPPING[mood as keyof typeof this.MOOD_TO_MUSIC_MAPPING];
      if (mapping) {
        mapping.genres.forEach(genre => allGenres.add(genre));
        mapping.vibes.forEach(vibe => allVibes.add(vibe));
        mapping.cultural.forEach(term => allCulturalTerms.add(term));
        
        // Merge audio features (average them)
        Object.entries(mapping.audioFeatures).forEach(([key, value]) => {
          if (!audioFeatures[key]) {
            audioFeatures[key] = { sum: 0, count: 0 };
          }
          audioFeatures[key].sum += value as number;
          audioFeatures[key].count += 1;
        });
      }
    });

    // Average the audio features
    const averagedAudioFeatures: { [key: string]: number } = {};
    Object.entries(audioFeatures).forEach(([key, { sum, count }]) => {
      averagedAudioFeatures[key] = sum / count;
    });

    return {
      primaryMood,
      secondaryMoods,
      genres: Array.from(allGenres),
      vibes: Array.from(allVibes),
      culturalTerms: Array.from(allCulturalTerms),
      audioFeatures: averagedAudioFeatures
    };
  }

  // Generate niche search terms based on emoji analysis
  static generateNicheSearchTerms(emojis: string[], vibe: string): string[] {
    const analysis = this.analyzeEmojis(emojis);
    const terms = new Set<string>();

    // Add genre-based terms
    analysis.genres.forEach(genre => {
      terms.add(`${genre} underground`);
      terms.add(`${genre} experimental`);
      terms.add(`${genre} artists`);
    });

    // Add vibe-based terms
    analysis.vibes.forEach(vibe => {
      terms.add(`${vibe} music`);
      terms.add(`${vibe} soundscapes`);
    });

    // Add cultural terms
    analysis.culturalTerms.forEach(term => {
      terms.add(term);
    });

    // Add experimental combinations
    if (analysis.genres.length >= 2) {
      const genre1 = analysis.genres[0];
      const genre2 = analysis.genres[1];
      terms.add(`${genre1} ${genre2}`);
      terms.add(`${genre2} ${genre1}`);
    }

    return Array.from(terms).slice(0, 15); // Limit to 15 terms
  }

  // Get audio features for Spotify recommendations
  static getAudioFeatures(emojis: string[], vibe: string): any {
    const analysis = this.analyzeEmojis(emojis);
    const baseFeatures: { [key: string]: number } = {
      min_popularity: 20,
      max_popularity: 70,
      min_acousticness: 0.1,
      max_acousticness: 0.9,
      min_instrumentalness: 0.0,
      max_instrumentalness: 0.8,
      min_energy: 0.1,
      max_energy: 0.9,
      min_danceability: 0.1,
      max_danceability: 0.9,
      min_valence: 0.1,
      max_valence: 0.9,
    };

    // Override with emoji-derived features
    Object.entries(analysis.audioFeatures).forEach(([key, value]) => {
      if (key.startsWith('min_')) {
        baseFeatures[key] = value as number;
      } else if (key.startsWith('max_')) {
        baseFeatures[key] = value as number;
      }
    });

    return baseFeatures;
  }
}

// Simplified Playlist Service
class PlaylistService {
  // Generate complete playlist with one function call
  async generatePlaylist(
    emojis: string[],
    songCount: number,
    vibe: string
  ): Promise<PlaylistData> {
    console.log('🎵 Generating playlist:', { emojis, songCount, vibe });

    // 1. Generate playlist info and cover image in parallel
    const [playlistInfo, coverImageUrl] = await Promise.all([
      this.generatePlaylistInfo(emojis, songCount, vibe),
      this.generateCoverImage(emojis, vibe).catch(() => undefined)
    ]);

    // 2. Generate tracks with enhanced uniqueness
    const tracks = await this.generateTracks(emojis, songCount, vibe, playlistInfo.keywords);

    // 3. Calculate uniqueness score
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

  // Generate playlist info using OpenAI
  private async generatePlaylistInfo(emojis: string[], songCount: number, vibe: string) {
    const emojiString = emojis.join(' ');
    
    const prompt = `Create a music playlist name, description, and color palette based on:
- These emojis: ${emojiString}
- Number of songs: ${songCount}
- User's vibe/mood: "${vibe}"

Please respond with a JSON object in this exact format:
{
  "name": "Creative playlist name here",
  "description": "A single compelling sentence that captures the playlist's mood and vibe",
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

The playlist name should be extremely unique, creative, and different from typical playlist names. 
Use only one or two words. It should be lowercase. Avoid generic or common phrases and do NOT use words like "Rage", "Chill", "Vibes", "Energy", "Party", "Focus", "Mood", "Mix", "Playlist", or any other common playlist terms.
Invent a new word, use poetic language, or combine words in an unexpected way. 
Examples of good names: "nightglow", "vaporhaze", "glasswave", "solstice", "dreamtide", "pulsefield", "lumen", "aether", "velvetine", "mistline".

Description guidelines:
- Be poetic, artistic, or emotionally resonant — avoid clichés and generic phrases
- Capture the vibe using tone, feeling, or imagery — not specific genres or instruments
- Keep the sentence under 20 words
- No hashtags, emojis, or lists — just one strong sentence

The name should be catchy and reflect the vibe. 
The description should feel fresh and thoughtful — not robotic or overly promotional.
End with a period.

For the color palette, generate 3 vibrant, contrasting colors in hex format based on the vibe. 
IMPORTANT: Do NOT use black (#000000), white (#FFFFFF), or any very dark (#111111, #222222) or very light (#FEFEFE, #EEEEEE) colors. 
Choose rich, saturated colors that are visually distinct from each other and match the mood.

For the keywords, generate 3-5 specific music-related terms that would help find songs on Spotify. These should be:
- Genre names (e.g., "indie rock", "electronic", "jazz")
- Mood descriptors (e.g., "energetic", "chill", "romantic")
- Tempo indicators (e.g., "upbeat", "slow", "dance")
- Era or style (e.g., "80s", "acoustic", "synthwave")
- Artist types (e.g., "female vocalists", "instrumental")

Examples: ["indie pop", "energetic", "summer vibes"] or ["jazz", "chill", "late night"]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 200,
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
      const parsed = JSON.parse(content);
      return {
        name: parsed.name || this.generateFallbackName(emojis, vibe),
        description: parsed.description || this.generateFallbackDescription(emojis, vibe),
        colorPalette: parsed.colorPalette || this.generateFallbackColors(emojis, vibe),
        keywords: parsed.keywords || this.generateFallbackKeywords(emojis, vibe),
      };
    } catch {
      return {
        name: this.generateFallbackName(emojis, vibe),
        description: this.generateFallbackDescription(emojis, vibe),
        colorPalette: this.generateFallbackColors(emojis, vibe),
        keywords: this.generateFallbackKeywords(emojis, vibe),
      };
    }
  }

  // Generate fallback name based on emoji analysis
  private generateFallbackName(emojis: string[], vibe: string): string {
    const analysis = EmojiAnalyzer.analyzeEmojis(emojis);
    const primaryMood = analysis.primaryMood;
    
    const moodToName: { [key: string]: string } = {
      happy: 'luminance',
      calm: 'serenity',
      love: 'tenderness',
      sad: 'melancholy',
      angry: 'ferocity',
      confused: 'enigma',
      excited: 'euphoria',
      dreamy: 'ethereal',
      nostalgic: 'reminiscence',
      nature: 'organic',
      weather: 'atmosphere',
      mysterious: 'obscurity',
      cozy: 'warmth'
    };
    
    return moodToName[primaryMood] || 'vibes';
  }

  // Generate fallback description based on emoji analysis
  private generateFallbackDescription(emojis: string[], vibe: string): string {
    const analysis = EmojiAnalyzer.analyzeEmojis(emojis);
    const primaryMood = analysis.primaryMood;
    
    const moodToDescription: { [key: string]: string } = {
      happy: 'A collection of uplifting and bright musical moments.',
      calm: 'Gentle soundscapes for peaceful contemplation.',
      love: 'Intimate melodies that speak to the heart.',
      sad: 'Melancholic tones for introspective moments.',
      angry: 'Raw energy and intense sonic expression.',
      confused: 'Surreal and disorienting musical landscapes.',
      excited: 'Dynamic rhythms that spark celebration.',
      dreamy: 'Ethereal sounds that transport the mind.',
      nostalgic: 'Sonic memories from another time.',
      nature: 'Organic sounds inspired by the natural world.',
      weather: 'Atmospheric compositions reflecting the elements.',
      mysterious: 'Enigmatic sounds that hide in shadows.',
      cozy: 'Warm and comforting musical embrace.'
    };
    
    return moodToDescription[primaryMood] || 'A carefully curated musical journey.';
  }

  // Generate fallback colors based on emoji analysis
  private generateFallbackColors(emojis: string[], vibe: string): string[] {
    const analysis = EmojiAnalyzer.analyzeEmojis(emojis);
    const primaryMood = analysis.primaryMood;
    
    const moodToColors: { [key: string]: string[] } = {
      happy: ['#FFD700', '#FF6B6B', '#4ECDC4'],
      calm: ['#87CEEB', '#98D8C8', '#F7DC6F'],
      love: ['#FF69B4', '#DDA0DD', '#FFB6C1'],
      sad: ['#708090', '#4682B4', '#2F4F4F'],
      angry: ['#DC143C', '#8B0000', '#FF4500'],
      confused: ['#9370DB', '#8A2BE2', '#9932CC'],
      excited: ['#FF1493', '#00CED1', '#FFD700'],
      dreamy: ['#E6E6FA', '#DDA0DD', '#B0E0E6'],
      nostalgic: ['#DEB887', '#F4A460', '#CD853F'],
      nature: ['#228B22', '#32CD32', '#90EE90'],
      weather: ['#87CEEB', '#B0C4DE', '#F0F8FF'],
      mysterious: ['#2F2F2F', '#4B0082', '#191970'],
      cozy: ['#DEB887', '#F5DEB3', '#D2B48C']
    };
    
    return moodToColors[primaryMood] || ['#6366f1', '#8b5cf6', '#a855f7'];
  }

  // Generate fallback keywords based on emoji analysis
  private generateFallbackKeywords(emojis: string[], vibe: string): string[] {
    const analysis = EmojiAnalyzer.analyzeEmojis(emojis);
    return [
      analysis.genres[0] || 'indie',
      analysis.vibes[0] || 'atmospheric',
      analysis.culturalTerms[0]?.split(' ')[0] || 'vibes'
    ];
  }

  // Generate cover image using DALL-E
  private async generateCoverImage(emojis: string[], vibe: string): Promise<string> {
    const colorString = ["#6366f1", "#8b5cf6", "#a855f7"].join(', ');
    const prompt = `Create a high-quality album cover that completely fills a 1024x1024 canvas with no borders, frames, or empty areas. The style should be abstract, emotional, and inspired by the vibe "${vibe}".

Instructions:
- Use the following colors prominently in the composition: ${colorString}
- The artwork should reflect the vibe of: "${vibe}"
- Style the artwork with bold, atmospheric abstraction — expressive brush strokes, dreamy gradients, or glowing energy fields based on the vibe
- Integrate painterly textures, fluid motion, or surreal organic forms to evoke emotion
- Add subtle analog grain or film texture to give it a natural, album-cover feel
- Avoid any recognizable objects, faces, logos, or symbols — pure expressive abstraction
- Do not include any text

Style:
- A fusion of abstract expressionism, digital surrealism, and modern ambient art
- If the vibe is high energy (like party, electronic, workout), include glowing neon effects or kinetic motion
- If the vibe is chill, sad, or romantic, lean into soft light, blur, and fluid color blending

Mood:
- Should match the vibe: "${vibe}"
- Must feel emotionally immersive, sophisticated, and visually striking

Final Output:
- Square (1024x1024 px)
- Edge-to-edge artwork with no borders
- Should look like a professionally designed cover that captures the music's essence`;

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
        style: 'vivid',
      }),
    });

    if (!response.ok) {
      throw new Error(`DALL-E API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.[0]?.url || '';
  }

  // Generate tracks using AI-powered approach for diversity
  private async generateTracks(
    emojis: string[], 
    songCount: number, 
    vibe: string, 
    keywords: string[]
  ): Promise<SpotifyTrack[]> {
    console.log('🎵 Generating diverse tracks for:', { emojis, vibe, keywords });
    
    const allTracks: SpotifyTrack[] = [];

    // 1. Analyze emojis to get comprehensive music mapping
    const emojiAnalysis = EmojiAnalyzer.analyzeEmojis(emojis);
    console.log('🔍 Emoji analysis:', emojiAnalysis);

    // 2. Generate niche search terms
    const nicheTerms = EmojiAnalyzer.generateNicheSearchTerms(emojis, vibe);
    console.log('🔍 Generated niche terms:', nicheTerms);

    // 3. Get diverse recommendations using multiple approaches
    const recommendationPromises = [];

    // Approach 1: Genre-based recommendations
    for (const genre of emojiAnalysis.genres.slice(0, 5)) {
      recommendationPromises.push(
        this.getGenreRecommendations([genre], vibe, songCount * 2)
      );
    }

    // Approach 2: Niche search terms with random offsets
    for (const term of nicheTerms.slice(0, 8)) {
      recommendationPromises.push(
        this.searchNicheTracksWithOffset(term, vibe, Math.min(8, songCount))
      );
    }

    // Approach 3: Artist discovery with seed artists
    recommendationPromises.push(
      this.discoverVibeArtistsWithSeeds(vibe, emojis, songCount)
    );

    // Approach 4: Cultural terms from emoji analysis
    for (const term of emojiAnalysis.culturalTerms.slice(0, 4)) {
      recommendationPromises.push(
        this.searchNicheTracksWithOffset(term, vibe, Math.min(6, songCount))
      );
    }

    // Execute all searches in parallel
    const results = await Promise.allSettled(recommendationPromises);
    
    // Collect all tracks
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        result.value.forEach(track => {
          if (!allTracks.find(t => t.id === track.id)) {
            allTracks.push(track);
          }
        });
      }
    });

    console.log(`📊 Found ${allTracks.length} total tracks`);

    // 4. Advanced filtering and diversification
    const filteredTracks = this.advancedFilterTracks(allTracks, vibe, emojis);
    const diversifiedTracks = this.advancedDiversifyPlaylist(filteredTracks, songCount);

    console.log(`🎯 Final playlist: ${diversifiedTracks.length} diverse tracks`);
    return diversifiedTracks;
  }

  // Search for niche tracks with random offset to avoid top results
  private async searchNicheTracksWithOffset(term: string, vibe: string, limit: number): Promise<SpotifyTrack[]> {
    try {
      // Use random offset to get deeper results
      const offset = Math.floor(Math.random() * 100);
      const searchResults = await spotifyService.search(
        term,
        ['track'],
        Math.min(limit, 10),
        offset
      );
      return searchResults.tracks.items;
    } catch (error) {
      console.warn(`Niche search for "${term}" failed:`, error);
      return [];
    }
  }

  // Discover vibe-specific artists with seed artist approach
  private async discoverVibeArtistsWithSeeds(vibe: string, emojis: string[], limit: number): Promise<SpotifyTrack[]> {
    try {
      const emojiAnalysis = EmojiAnalyzer.analyzeEmojis(emojis);
      const allTracks: SpotifyTrack[] = [];
      const discoveredArtists: string[] = [];

      // Use emoji analysis to find obscure artists
      const searchTerms = [
        ...emojiAnalysis.genres.map(genre => `${genre} artists`),
        ...emojiAnalysis.vibes.map(vibe => `${vibe} music`),
        ...emojiAnalysis.culturalTerms.slice(0, 2)
      ];

      for (const term of searchTerms.slice(0, 3)) {
        const searchResults = await spotifyService.search(
          term,
          ['track'],
          Math.min(limit / 3, 8),
          Math.floor(Math.random() * 50) // Random offset
        );
        
        // Extract artist IDs from found tracks
        searchResults.tracks.items.forEach(track => {
          const artistId = track.artists[0]?.id;
          if (artistId && !discoveredArtists.includes(artistId)) {
            discoveredArtists.push(artistId);
          }
        });
        
        allTracks.push(...searchResults.tracks.items);
      }

      // Use discovered artists as seeds for recommendations
      if (discoveredArtists.length > 0) {
        const seedArtists = discoveredArtists.slice(0, 5); // Spotify allows max 5 seed artists
        const recommendations = await spotifyService.getRecommendations({
          seed_artists: seedArtists,
          limit: Math.min(limit, 20),
          ...EmojiAnalyzer.getAudioFeatures(emojis, vibe),
        });
        allTracks.push(...recommendations.tracks);
      }

      return allTracks;
    } catch (error) {
      console.warn('Artist discovery failed:', error);
      return [];
    }
  }

  // Get genre-based recommendations
  private async getGenreRecommendations(genres: string[], vibe: string, limit: number): Promise<SpotifyTrack[]> {
    try {
      const recommendations = await spotifyService.getRecommendations({
        seed_genres: genres.slice(0, 5),
        limit: Math.min(limit, 40),
        ...EmojiAnalyzer.getAudioFeatures([], vibe),
      });
      return recommendations.tracks;
    } catch (error) {
      console.warn('Genre recommendations failed:', error);
      return [];
    }
  }

  // Enhanced filtering to remove mainstream tracks
  private advancedFilterTracks(tracks: SpotifyTrack[], vibe: string, emojis: string[]): SpotifyTrack[] {
    const vibeLower = vibe.toLowerCase();
    const vibeWords = vibeLower.split(' ').filter(word => word.length > 2);
    
    return tracks.filter(track => {
      const trackTitle = track.name.toLowerCase();
      const artistName = track.artists.map(artist => artist.name.toLowerCase()).join(' ');
      
      // Filter out tracks with obvious vibe words in title or artist
      const hasObviousVibeWord = vibeWords.some(word => 
        trackTitle.includes(word) || artistName.includes(word)
      );
      
      // Filter out tracks with repetitive patterns
      const hasRepetitivePattern = this.hasRepetitivePattern(trackTitle, artistName);
      
      // Filter out mainstream indicators
      const hasMainstreamIndicators = this.hasMainstreamIndicators(trackTitle, artistName);
      
      return !hasObviousVibeWord && !hasRepetitivePattern && !hasMainstreamIndicators;
    });
  }

  // Check for mainstream indicators
  private hasMainstreamIndicators(title: string, artist: string): boolean {
    const mainstreamPatterns = [
      /feat\./i, /ft\./i, /featuring/i, // Features often indicate mainstream
      /remix/i, /radio edit/i, /clean version/i, // Remixes and edits
      /official/i, /music video/i, /lyric video/i, // Official releases
      /deluxe/i, /extended/i, /bonus/i, // Deluxe editions
      /live/i, /concert/i, /performance/i, // Live versions
      /explicit/i, /clean/i, // Explicit/clean versions
      /acoustic version/i, /piano version/i, // Alternative versions
      /instrumental/i, /karaoke/i, // Instrumental/karaoke versions
    ];
    
    // Dynamic mainstream detection based on patterns
    const mainstreamIndicators = [
      // High follower count indicators (common in mainstream)
      /verified/i, /official/i, /viral/i, /trending/i,
      
      // Chart/playlist indicators
      /top hits/i, /billboard/i, /charts/i, /hot 100/i,
      
      // Commercial indicators
      /radio/i, /commercial/i, /advertisement/i, /sponsored/i,
      
      // Mass appeal indicators
      /everyone/i, /worldwide/i, /global/i, /international/i,
      
      // Popular culture references
      /tiktok/i, /instagram/i, /youtube/i, /streaming/i,
    ];
    
    const hasMainstreamPattern = mainstreamPatterns.some(pattern => 
      pattern.test(title) || pattern.test(artist)
    );
    
    const hasMainstreamIndicator = mainstreamIndicators.some(indicator => 
      indicator.test(title) || indicator.test(artist)
    );
    
    // Check for overly generic/popular terms
    const genericTerms = [
      'love', 'heart', 'baby', 'girl', 'boy', 'night', 'day', 'time',
      'world', 'life', 'dream', 'hope', 'feel', 'want', 'need', 'see',
      'know', 'think', 'say', 'tell', 'come', 'go', 'get', 'make'
    ];
    
    const hasGenericTerms = genericTerms.some(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      return regex.test(title) || regex.test(artist);
    });
    
    // Check for repetitive/common artist name patterns
    const commonArtistPatterns = [
      /^the\s+\w+$/i, // "The [Something]"
      /^\w+\s+and\s+the\s+\w+$/i, // "[Name] and the [Something]"
      /^\w+\s+\w+\s+band$/i, // "[Name] [Name] Band"
      /^\w+\s+collective$/i, // "[Name] Collective"
      /^\w+\s+project$/i, // "[Name] Project"
    ];
    
    const hasCommonArtistPattern = commonArtistPatterns.some(pattern => 
      pattern.test(artist)
    );
    
    return hasMainstreamPattern || hasMainstreamIndicator || (hasGenericTerms && hasCommonArtistPattern);
  }

  // Check for repetitive patterns in track names
  private hasRepetitivePattern(title: string, artist: string): boolean {
    // Dynamic pattern detection for repetitive/obvious music
    const repetitivePatterns = [
      // Common music industry patterns
      /feat\./i, /ft\./i, /featuring/i, /with/i,
      /remix/i, /mix/i, /version/i, /edit/i,
      /official/i, /original/i, /demo/i, /live/i,
      
      // Overly descriptive patterns
      /happy\s+music/i, /sad\s+song/i, /angry\s+rock/i,
      /chill\s+vibes/i, /energetic\s+beat/i, /romantic\s+ballad/i,
      
      // Generic emotional patterns
      /feeling\s+\w+/i, /i\s+feel\s+\w+/i, /makes\s+me\s+\w+/i,
      /when\s+i\s+\w+/i, /if\s+you\s+\w+/i, /because\s+you\s+\w+/i,
      
      // Common song title patterns
      /^the\s+\w+\s+song$/i, /^my\s+\w+\s+song$/i, /^this\s+is\s+\w+$/i,
      /^i\s+am\s+\w+$/i, /^you\s+are\s+\w+$/i, /^we\s+are\s+\w+$/i,
      
      // Repetitive emotional words
      /love\s+love/i, /sad\s+sad/i, /happy\s+happy/i, /angry\s+angry/i,
      /cry\s+cry/i, /dance\s+dance/i, /sing\s+sing/i, /play\s+play/i,
    ];
    
    // Check for excessive use of common words
    const commonWords = ['love', 'heart', 'baby', 'girl', 'boy', 'night', 'day'];
    const wordCounts: { [word: string]: number } = {};
    
    const allText = `${title} ${artist}`.toLowerCase();
    commonWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = allText.match(regex);
      wordCounts[word] = matches ? matches.length : 0;
    });
    
    const hasExcessiveCommonWords = Object.values(wordCounts).some(count => count > 2);
    
    // Check for repetitive punctuation or formatting
    const repetitiveFormatting = [
      /\.{3,}/, // Multiple dots
      /!{2,}/,  // Multiple exclamation marks
      /#{2,}/,  // Multiple hashtags
      /\*{2,}/, // Multiple asterisks
    ];
    
    const hasRepetitiveFormatting = repetitiveFormatting.some(pattern => 
      pattern.test(title) || pattern.test(artist)
    );
    
    return repetitivePatterns.some(pattern => 
      pattern.test(title) || pattern.test(artist)
    ) || hasExcessiveCommonWords || hasRepetitiveFormatting;
  }

  // Calculate playlist uniqueness score
  private calculatePlaylistUniquenessScore(tracks: SpotifyTrack[], vibe: string, emojis: string[]): number {
    if (tracks.length === 0) return 0;
    
    let score = 0;
    
    // 1. Artist diversity (higher score for more unique artists)
    const uniqueArtists = new Set(tracks.map(track => track.artists[0]?.id).filter(Boolean));
    const artistDiversityScore = (uniqueArtists.size / tracks.length) * 40; // Max 40 points
    score += artistDiversityScore;
    
    // 2. Genre diversity (estimate from artist names)
    const genres = new Set<string>();
    tracks.forEach(track => {
      const artistName = track.artists[0]?.name?.toLowerCase() || '';
      const estimatedGenre = this.estimateGenreFromArtist(artistName);
      if (estimatedGenre) genres.add(estimatedGenre);
    });
    const genreDiversityScore = Math.min(genres.size * 5, 30); // Max 30 points
    score += genreDiversityScore;
    
    // 3. Title uniqueness (longer, more unique titles get higher scores)
    const titleScores = tracks.map(track => {
      const words = track.name.toLowerCase().split(' ').length;
      const uniqueWords = new Set(track.name.toLowerCase().split(' ')).size;
      return Math.min((words + uniqueWords) / 2, 10); // Max 10 points per track
    });
    const avgTitleScore = titleScores.reduce((sum, score) => sum + score, 0) / tracks.length;
    score += avgTitleScore;
    
    // 4. Vibe accuracy bonus
    const vibeAccuracyBonus = this.calculateVibeAccuracyBonus(tracks, vibe, emojis);
    score += vibeAccuracyBonus;
    
    // Normalize to 0-100 scale
    return Math.min(Math.max(Math.round(score), 0), 100);
  }

  // Calculate vibe accuracy bonus
  private calculateVibeAccuracyBonus(tracks: SpotifyTrack[], vibe: string, emojis: string[]): number {
    const emojiAnalysis = EmojiAnalyzer.analyzeEmojis(emojis);
    let bonus = 0;
    
    // Check if tracks align with the vibe
    const vibeAlignmentCount = tracks.filter(track => {
      const trackTitle = track.name.toLowerCase();
      const artistName = track.artists.map(artist => artist.name.toLowerCase()).join(' ');
      
      // Check for vibe-appropriate terms from emoji analysis
      const vibeAppropriateTerms = [
        ...emojiAnalysis.vibes,
        ...emojiAnalysis.genres,
        ...emojiAnalysis.culturalTerms
      ];
      
      return vibeAppropriateTerms.some(term => 
        trackTitle.includes(term.toLowerCase()) || artistName.includes(term.toLowerCase())
      );
    }).length;
    
    // Bonus for tracks that align with vibe without being obvious
    bonus += (vibeAlignmentCount / tracks.length) * 20; // Max 20 points
    
    return bonus;
  }

  // Helper to check if a track is mainstream
  private isMainstreamTrack(track: SpotifyTrack): boolean {
    // Use pattern-based detection and popularity if available
    const artistNames = track.artists.map(a => a.name).join(' ');
    // If popularity is available on the track object, use it
    const popularity = (track as any).popularity;
    return (
      this.hasMainstreamIndicators(track.name, artistNames) ||
      (typeof popularity === 'number' && popularity > 70)
    );
  }

  // Advanced diversification with multiple strategies
  private advancedDiversifyPlaylist(tracks: SpotifyTrack[], targetCount: number): SpotifyTrack[] {
    const diversifiedTracks: SpotifyTrack[] = [];
    const artistCounts: { [artistId: string]: number } = {};
    const genreCounts: { [genre: string]: number } = {};
    const maxTracksPerArtist = 1; // Only 1 track per artist for maximum diversity
    const maxTracksPerGenre = 3; // Limit tracks per genre
    const maxMainstreamPercent = 0.2; // Allow up to 20% mainstream
    let mainstreamCount = 0;

    // Sort tracks by diversity score
    const scoredTracks = tracks.map((track: SpotifyTrack) => ({
      track,
      score: this.calculateDiversityScore(track, artistCounts, genreCounts)
    })).sort((a, b) => b.score - a.score);

    for (const { track } of scoredTracks) {
      if (diversifiedTracks.length >= targetCount) break;

      const artistId = track.artists[0]?.id;
      const artistName = track.artists[0]?.name?.toLowerCase() || '';
      const estimatedGenre = this.estimateGenreFromArtist(artistName);

      // Check artist/genre limits
      if (artistId && (artistCounts[artistId] || 0) >= maxTracksPerArtist) continue;
      if (estimatedGenre && (genreCounts[estimatedGenre] || 0) >= maxTracksPerGenre) continue;

      // Check mainstream limit
      if (this.isMainstreamTrack(track)) {
        if (mainstreamCount >= Math.floor(targetCount * maxMainstreamPercent)) continue;
        mainstreamCount++;
      }

      // Add track
      if (artistId) artistCounts[artistId] = (artistCounts[artistId] || 0) + 1;
      if (estimatedGenre) genreCounts[estimatedGenre] = (genreCounts[estimatedGenre] || 0) + 1;
      diversifiedTracks.push(track);
    }

    return diversifiedTracks;
  }

  // Calculate diversity score for a track
  private calculateDiversityScore(
    track: SpotifyTrack, 
    artistCounts: { [artistId: string]: number }, 
    genreCounts: { [genre: string]: number }
  ): number {
    const artistId = track.artists[0]?.id;
    const artistName = track.artists[0]?.name?.toLowerCase() || '';
    
    let score = 0;
    
    // Prefer artists we haven't used much
    if (artistId) {
      score += 10 - (artistCounts[artistId] || 0) * 5;
    }
    
    // Prefer genres we haven't used much
    const estimatedGenre = this.estimateGenreFromArtist(artistName);
    if (estimatedGenre) {
      score += 5 - (genreCounts[estimatedGenre] || 0) * 2;
    }
    
    // Prefer tracks with unique names
    const titleWords = track.name.toLowerCase().split(' ').length;
    score += Math.min(titleWords, 5);
    
    return score;
  }

  // Estimate genre from artist name (dynamic pattern-based detection)
  private estimateGenreFromArtist(artistName: string): string | null {
    // Dynamic genre detection patterns
    const genrePatterns = [
      // Metal/Hardcore patterns
      { pattern: /(core|metal|death|black|thrash|doom|grind)/i, genre: 'metal' },
      
      // Rock patterns
      { pattern: /(rock|punk|grunge|garage|indie|alternative)/i, genre: 'rock' },
      
      // Electronic patterns
      { pattern: /(electronic|techno|house|trance|dubstep|ambient|synth|wave)/i, genre: 'electronic' },
      
      // Pop patterns
      { pattern: /(pop|indie-pop|dream-pop|power-pop|synth-pop)/i, genre: 'pop' },
      
      // Folk/Acoustic patterns
      { pattern: /(folk|acoustic|singer-songwriter|americana|bluegrass)/i, genre: 'folk' },
      
      // Jazz patterns
      { pattern: /(jazz|swing|bebop|fusion|smooth)/i, genre: 'jazz' },
      
      // Hip-hop patterns
      { pattern: /(rap|hip-hop|trap|grime|drill)/i, genre: 'hip-hop' },
      
      // Classical patterns
      { pattern: /(classical|orchestra|symphony|chamber|neo-classical)/i, genre: 'classical' },
      
      // Experimental patterns
      { pattern: /(experimental|avant-garde|noise|drone|industrial)/i, genre: 'experimental' },
      
      // World music patterns
      { pattern: /(world|ethnic|traditional|cultural|global)/i, genre: 'world' },
    ];
    
    // Check for genre patterns in artist name
    for (const { pattern, genre } of genrePatterns) {
      if (pattern.test(artistName)) {
        return genre;
      }
    }
    
    // Check for common artist name suffixes that indicate genre
    const suffixPatterns = [
      { pattern: /(band|group|collective|ensemble)$/i, genre: 'rock' },
      { pattern: /(project|experiment|lab|studio)$/i, genre: 'experimental' },
      { pattern: /(orchestra|quartet|trio|duo)$/i, genre: 'classical' },
      { pattern: /(dj|producer|beats|sound)$/i, genre: 'electronic' },
    ];
    
    for (const { pattern, genre } of suffixPatterns) {
      if (pattern.test(artistName)) {
        return genre;
      }
    }
    
    return null;
  }

  // Save playlist to Spotify
  async saveToSpotify(playlistData: PlaylistData): Promise<PlaylistData> {
    if (!(await spotifyService.isAuthenticated())) {
      throw new Error('Please connect to Spotify first');
    }

    const trackUris = playlistData.tracks.map(track => track.uri);
    
    const spotifyPlaylist = await spotifyService.createPlaylistWithTracks(
      playlistData.name,
      playlistData.description,
      trackUris,
      true
    );

    return {
      ...playlistData,
      id: spotifyPlaylist.id,
      spotifyUrl: spotifyPlaylist.external_urls.spotify,
      isSpotifyPlaylist: true,
    };
  }
}

export const playlistService = new PlaylistService(); 