import { spotifyService } from './spotify';
import { OPENAI_API_KEY } from '../env';
import { ALL_MOOD_EMOJIS } from '../app/constants/emojis';

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

    // 2. Generate tracks
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
        name: parsed.name || 'My Playlist',
        description: parsed.description || 'A great mix of songs',
        colorPalette: parsed.colorPalette || ["#6366f1", "#8b5cf6", "#a855f7"],
        keywords: parsed.keywords || ["indie", "chill", "vibes"],
      };
    } catch {
      return {
        name: 'My Playlist',
        description: 'A great mix of songs',
        colorPalette: ["#6366f1", "#8b5cf6", "#a855f7"],
        keywords: ["indie", "chill", "vibes"],
      };
    }
  }

  // Generate cover image using DALL-E
  private async generateCoverImage(emojis: string[], vibe: string): Promise<string> {
    const colorString = ["#6366f1", "#8b5cf6", "#a855f7"].join(', ');
    const prompt = `Create a high-quality album cover that completely fills a 1024x1024 canvas with no borders, frames, or empty areas. The style should be abstract, emotional, and inspired by the vibe "${vibe}".

Instructions:
- Use the following colors prominently in the composition: ${colorString}
- The artwork should feature soft gradients, painterly textures, and blurred organic shapes
- Incorporate a subtle grainy, analog film texture overlay throughout the entire canvas
- Avoid any sharp lines, symbols, objects, text, or recognizable forms
- The composition should feel hand-painted, artistic, and emotionally resonant
- Prioritize balance, aesthetic harmony, and atmospheric depth

Style:
- Abstract expressionism meets modern minimalism
- Soft brush strokes, gradient blends, moody ambient textures

Mood:
- Evocative, immersive, tasteful, clean

Final Output:
- Square (1024x1024)
- Edge-to-edge artwork with no empty space
- Must look like a professional, organic, natural album cover rather than AI-generated art`;

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

  // Generate tracks using simplified approach
  private async generateTracks(
    emojis: string[], 
    songCount: number, 
    vibe: string, 
    keywords: string[]
  ): Promise<SpotifyTrack[]> {
    const validEmojis = emojis.filter(emoji => ALL_MOOD_EMOJIS.includes(emoji));
    const allTracks: SpotifyTrack[] = [];

    // 1. Get recommendations based on genres
    const genres = this.mapEmojisToGenres(validEmojis);
    if (genres.length > 0) {
      try {
        const recommendations = await spotifyService.getRecommendations({
          seed_genres: genres.slice(0, 5),
          limit: Math.min(songCount * 2, 40),
          ...this.getVibeParameters(vibe),
        });
        recommendations.tracks.forEach(track => {
          if (!allTracks.find(t => t.id === track.id)) {
            allTracks.push(track);
          }
        });
      } catch (error) {
        console.warn('Recommendations failed, continuing with search');
      }
    }

    // 2. Search using keywords
    for (const keyword of keywords.slice(0, 5)) {
      if (allTracks.length >= songCount * 2) break;
      
      try {
        const searchResults = await spotifyService.search(
          `${keyword} music`,
          ['track'],
          Math.min(10, songCount - allTracks.length)
        );
        
        searchResults.tracks.items.forEach(track => {
          if (!allTracks.find(t => t.id === track.id) && allTracks.length < songCount * 2) {
            allTracks.push(track);
          }
        });
      } catch (error) {
        console.warn(`Search for "${keyword}" failed`);
      }
    }

    // 3. Filter and diversify
    const filteredTracks = this.filterTracksByVibe(allTracks, vibe);
    const diversifiedTracks = this.diversifyPlaylist(filteredTracks);

    return diversifiedTracks.slice(0, songCount);
  }

  // Helper methods
  private mapEmojisToGenres(emojis: string[]): string[] {
    const emojiToGenre: { [key: string]: string[] } = {
      '😊': ['happy', 'pop', 'indie-pop'],
      '😢': ['sad', 'indie', 'acoustic'],
      '😡': ['rock', 'metal', 'punk'],
      '😴': ['chill', 'ambient', 'sleep'],
      '🎉': ['party', 'dance', 'edm'],
      '💕': ['romance', 'r-n-b', 'pop'],
      '🔥': ['hip-hop', 'trap', 'edm'],
      '🌊': ['chill', 'ambient', 'electronic'],
      '🌙': ['chill', 'ambient', 'sleep'],
      '☀️': ['happy', 'pop', 'indie-pop'],
      '🌧️': ['sad', 'indie', 'acoustic'],
      '⚡': ['rock', 'electronic', 'edm'],
      '🎸': ['rock', 'indie', 'alternative'],
      '🎹': ['piano', 'classical', 'jazz'],
      '🎤': ['pop', 'r-n-b', 'singer-songwriter'],
      '🎧': ['electronic', 'ambient', 'chill'],
      '🏠': ['indie', 'folk', 'acoustic'],
      '🚗': ['road-trip', 'rock', 'country'],
      '🏃': ['work-out', 'edm', 'hip-hop'],
      '📚': ['study', 'ambient', 'classical'],
      '🍃': ['folk', 'acoustic', 'indie'],
      '🌺': ['indie-pop', 'folk', 'acoustic'],
      '🌴': ['reggae', 'latin', 'tropical'],
      '❄️': ['ambient', 'chill', 'electronic'],
      '☁️': ['ambient', 'chill', 'rainy-day'],
      '🌩️': ['rock', 'electronic', 'edm'],
      '🌬️': ['ambient', 'chill', 'acoustic'],
    };

    const validGenres = [
      'acoustic', 'afrobeat', 'alt-rock', 'alternative', 'ambient', 'anime', 'black-metal', 'bluegrass', 'blues', 'bossanova', 'brazil', 'breakbeat', 'british', 'cantopop', 'chicago-house', 'children', 'chill', 'classical', 'club', 'comedy', 'country', 'dance', 'dancehall', 'death-metal', 'deep-house', 'detroit-techno', 'disco', 'disney', 'drum-and-bass', 'dub', 'dubstep', 'edm', 'electro', 'electronic', 'emo', 'folk', 'forro', 'french', 'funk', 'garage', 'german', 'gospel', 'goth', 'grindcore', 'groove', 'grunge', 'guitar', 'happy', 'hard-rock', 'hardcore', 'hardstyle', 'heavy-metal', 'hip-hop', 'holidays', 'honky-tonk', 'house', 'idm', 'indian', 'indie', 'indie-pop', 'industrial', 'iranian', 'j-dance', 'j-idol', 'j-pop', 'j-rock', 'jazz', 'k-pop', 'kids', 'latin', 'latino', 'malay', 'mandopop', 'metal', 'metal-misc', 'metalcore', 'minimal-techno', 'movies', 'mpb', 'new-age', 'new-release', 'opera', 'pagode', 'party', 'philippines-opm', 'piano', 'pop', 'pop-film', 'post-dubstep', 'power-pop', 'progressive-house', 'psych-rock', 'punk', 'punk-rock', 'r-n-b', 'rainy-day', 'reggae', 'reggaeton', 'road-trip', 'rock', 'rock-n-roll', 'rockabilly', 'romance', 'sad', 'salsa', 'samba', 'sertanejo', 'show-tunes', 'singer-songwriter', 'ska', 'sleep', 'songwriter', 'soul', 'soundtracks', 'spanish', 'study', 'summer', 'swedish', 'synth-pop', 'tango', 'techno', 'trance', 'trip-hop', 'turkish', 'work-out', 'world-music'
    ];

    const genres = new Set<string>();
    emojis.forEach(emoji => {
      const emojiGenres = emojiToGenre[emoji] || [];
      emojiGenres.forEach(genre => {
        if (validGenres.includes(genre)) {
          genres.add(genre);
        }
      });
    });

    return Array.from(genres);
  }

  private getVibeParameters(vibe: string) {
    const vibeLower = vibe.toLowerCase();
    
    if (vibeLower.includes('sad') || vibeLower.includes('melancholy')) {
      return { target_valence: 0.3, target_energy: 0.4 };
    } else if (vibeLower.includes('happy') || vibeLower.includes('joy')) {
      return { target_valence: 0.8, target_energy: 0.7 };
    } else if (vibeLower.includes('chill') || vibeLower.includes('relax')) {
      return { target_energy: 0.3, target_acousticness: 0.7 };
    } else if (vibeLower.includes('energetic') || vibeLower.includes('pump')) {
      return { target_energy: 0.8, target_danceability: 0.7 };
    } else if (vibeLower.includes('romantic') || vibeLower.includes('love')) {
      return { target_valence: 0.6, target_acousticness: 0.5 };
    } else if (vibeLower.includes('party') || vibeLower.includes('dance')) {
      return { target_energy: 0.8, target_danceability: 0.8 };
    }
    
    return {};
  }

  private filterTracksByVibe(tracks: SpotifyTrack[], vibe: string): SpotifyTrack[] {
    const vibeLower = vibe.toLowerCase();
    const vibeWords = vibeLower.split(' ').filter(word => word.length > 2);
    
    return tracks.filter(track => {
      const trackTitle = track.name.toLowerCase();
      const artistName = track.artists.map(artist => artist.name.toLowerCase()).join(' ');
      
      const hasVibeWordInTitle = vibeWords.some(word => trackTitle.includes(word));
      const hasVibeWordInArtist = vibeWords.some(word => artistName.includes(word));
      
      return !hasVibeWordInTitle && !hasVibeWordInArtist;
    });
  }

  private diversifyPlaylist(tracks: SpotifyTrack[], maxTracksPerArtist: number = 2): SpotifyTrack[] {
    const artistCounts: { [artistId: string]: number } = {};
    const diversifiedTracks: SpotifyTrack[] = [];

    for (const track of tracks) {
      const artistId = track.artists[0]?.id;
      if (!artistId) continue;

      const currentCount = artistCounts[artistId] || 0;
      if (currentCount < maxTracksPerArtist) {
        artistCounts[artistId] = currentCount + 1;
        diversifiedTracks.push(track);
      }
    }

    return diversifiedTracks;
  }

  // Save playlist to Spotify
  async saveToSpotify(playlistData: PlaylistData): Promise<PlaylistData> {
    if (!spotifyService.isAuthenticated()) {
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