import { spotifyService } from './spotify';
import { generatePlaylistInfo } from './openai';
import { ALL_MOOD_EMOJIS } from '../app/constants/emojis';

export interface GeneratedPlaylist {
  id: string;
  name: string;
  description: string;
  colorPalette: string[];
  keywords: string[];
  coverImageUrl?: string;
  emojis: string[];
  songCount: number;
  vibe: string;
  tracks: SpotifyTrack[];
  spotifyUrl: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  uri: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images?: SpotifyImage[];
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

class PlaylistGenerator {
  // Convert emojis and vibe to Spotify search parameters
  private mapEmojisToGenres(emojis: string[]): string[] {
    const emojiToGenre: { [key: string]: string[] } = {
      // Happy emojis
      '😄': ['pop', 'happy', 'upbeat'],
      '😊': ['pop', 'indie', 'folk'],
      '😎': ['jazz', 'soul', 'r&b'],
      '🤩': ['pop', 'electronic', 'dance'],
      '✨': ['pop', 'indie', 'magical'],
      
      // Calm emojis
      '😌': ['ambient', 'chill', 'lofi'],
      '🌿': ['folk', 'indie', 'nature'],
      '🌊': ['ambient', 'chill', 'ocean'],
      '🧘': ['ambient', 'meditation', 'zen'],
      '🪷': ['ambient', 'spiritual', 'peaceful'],
      
      // Love emojis
      '🥰': ['pop', 'r&b', 'romance'],
      '😍': ['pop', 'r&b', 'romance'],
      '😘': ['pop', 'r&b', 'romance'],
      '💖': ['pop', 'r&b', 'romance'],
      '💘': ['pop', 'r&b', 'romance'],
      
      // Sad emojis
      '😔': ['sad', 'indie', 'folk'],
      '🌧️': ['sad', 'indie', 'melancholy'],
      '😢': ['sad', 'indie', 'folk'],
      '💔': ['sad', 'indie', 'emotional'],
      '🥀': ['sad', 'indie', 'melancholy'],
      
      // Angry emojis
      '😠': ['rock', 'metal', 'punk'],
      '🔥': ['hip-hop', 'trap', 'electronic'],
      '🤬': ['rock', 'metal', 'aggressive'],
      '💢': ['rock', 'metal', 'intense'],
      '⚡': ['electronic', 'dance', 'energetic'],
      
      // Confused emojis
      '🤯': ['experimental', 'electronic', 'psychedelic'],
      '😵': ['experimental', 'electronic', 'psychedelic'],
      '🤔': ['indie', 'alternative', 'thoughtful'],
      '😶‍🌫️': ['ambient', 'experimental', 'atmospheric'],
      '😕': ['indie', 'alternative', 'melancholy'],
      
      // Excited emojis
      '🥳': ['pop', 'dance', 'party'],
      '🎉': ['pop', 'dance', 'celebration'],
      '💫': ['ambient', 'electronic', 'magical'],
      
      // Nature emojis
      '🌅': ['ambient', 'nature', 'peaceful'],
      '🌈': ['pop', 'indie', 'alternative'],
      '🍃': ['folk', 'indie', 'nature'],
      
      // Weather emojis
      '☀️': ['pop', 'summer', 'happy'],
      '☁️': ['ambient', 'chill', 'atmospheric'],
      '🌩️': ['rock', 'electronic', 'intense'],
      '🌬️': ['ambient', 'atmospheric', 'wind'],
    };

    const genres = new Set<string>();
    emojis.forEach(emoji => {
      const emojiGenres = emojiToGenre[emoji] || [];
      emojiGenres.forEach(genre => genres.add(genre));
    });

    return Array.from(genres);
  }

  // Map vibe text to Spotify parameters
  private mapVibeToParameters(vibe: string): {
    target_energy?: number;
    target_danceability?: number;
    target_valence?: number;
    target_tempo?: number;
    target_acousticness?: number;
  } {
    const vibeLower = vibe.toLowerCase();
    const params: any = {};

    // Energy mapping
    if (vibeLower.includes('energetic') || vibeLower.includes('pump') || vibeLower.includes('workout')) {
      params.target_energy = 0.8;
      params.target_danceability = 0.7;
    } else if (vibeLower.includes('chill') || vibeLower.includes('relax') || vibeLower.includes('calm')) {
      params.target_energy = 0.3;
      params.target_acousticness = 0.7;
    } else if (vibeLower.includes('sad') || vibeLower.includes('melancholy') || vibeLower.includes('blue')) {
      params.target_energy = 0.3;
      params.target_valence = 0.3;
    } else if (vibeLower.includes('happy') || vibeLower.includes('joy') || vibeLower.includes('upbeat')) {
      params.target_energy = 0.7;
      params.target_valence = 0.8;
    } else if (vibeLower.includes('romantic') || vibeLower.includes('love') || vibeLower.includes('intimate')) {
      params.target_energy = 0.4;
      params.target_valence = 0.6;
    } else if (vibeLower.includes('party') || vibeLower.includes('dance') || vibeLower.includes('club')) {
      params.target_energy = 0.8;
      params.target_danceability = 0.8;
      params.target_tempo = 130;
    }

    return params;
  }

  // Generate search queries based on vibe and keywords
  private generateSearchQueries(vibe: string, keywords: string[]): string[] {
    const queries = [];
    
    // Add vibe-based queries
    queries.push(vibe);
    
    // Add keyword-based queries
    keywords.forEach(keyword => {
      queries.push(keyword);
    });

    // Add some generic vibe-related terms
    if (vibe.toLowerCase().includes('chill')) {
      queries.push('chill vibes', 'relaxing', 'ambient');
    } else if (vibe.toLowerCase().includes('energetic')) {
      queries.push('energetic', 'upbeat', 'pump up');
    } else if (vibe.toLowerCase().includes('sad')) {
      queries.push('melancholy', 'sad songs', 'emotional');
    } else if (vibe.toLowerCase().includes('happy')) {
      queries.push('happy', 'feel good', 'positive');
    }

    return queries.slice(0, 5); // Limit to 5 queries
  }

  // Generate tracks without creating the actual playlist
  public async generateTracksOnly(
    emojis: string[],
    songCount: number,
    vibe: string
  ): Promise<SpotifyTrack[]> {
    console.log('generateTracksOnly called with:', { emojis, songCount, vibe });
    
    // Filter valid emojis but don't require them
    const validEmojis = emojis.filter(emoji => ALL_MOOD_EMOJIS.includes(emoji));
    console.log('Valid emojis:', validEmojis);
    
    // First, generate playlist info using OpenAI
    const playlistInfo = await generatePlaylistInfo({
      emojis: validEmojis,
      songCount,
      vibe,
    });
    console.log('Playlist info generated:', playlistInfo.name);

    // Map emojis to genres (if any emojis provided)
    const genres = validEmojis.length > 0 ? this.mapEmojisToGenres(validEmojis) : [];
    console.log('Mapped genres:', genres);
    
    // Map vibe to Spotify parameters
    const vibeParams = this.mapVibeToParameters(vibe);
    console.log('Vibe parameters:', vibeParams);
    
    // Generate search queries
    const searchQueries = this.generateSearchQueries(vibe, playlistInfo.keywords);
    console.log('Search queries:', searchQueries);

    // Collect tracks from multiple sources
    const allTracks: SpotifyTrack[] = [];

    // 1. Get recommendations based on genres and vibe parameters
    if (genres.length > 0) {
      console.log('Trying to get recommendations with genres:', genres);
      const recommendations = await spotifyService.getRecommendations({
        seed_genres: genres.slice(0, 5), // Spotify allows max 5 seed genres
        limit: Math.min(songCount, 20),
        ...vibeParams,
      });
      
      console.log('Recommendations received:', recommendations.tracks.length);
      recommendations.tracks.forEach(track => {
        if (!allTracks.find(t => t.id === track.id)) {
          allTracks.push(track);
        }
      });
    }

    // 2. Search for tracks based on generated queries
    for (const query of searchQueries) {
      if (allTracks.length >= songCount) break;
      
      console.log('Searching for query:', query);
      const searchResults = await spotifyService.search(
        query,
        ['track'],
        Math.min(10, songCount - allTracks.length)
      );
      
      console.log('Search results for', query, ':', searchResults.tracks.items.length);
      searchResults.tracks.items.forEach(track => {
        if (!allTracks.find(t => t.id === track.id) && allTracks.length < songCount) {
          allTracks.push(track);
        }
      });
    }

    // 3. If we still need more tracks, get popular tracks in the genres or search by vibe
    if (allTracks.length < songCount) {
      const searchQuery = genres.length > 0 ? genres[0] : vibe;
      console.log('Getting popular tracks for:', searchQuery);
      const popularSearch = await spotifyService.search(
        searchQuery,
        ['track'],
        songCount - allTracks.length
      );
      
      console.log('Popular search results:', popularSearch.tracks.items.length);
      popularSearch.tracks.items.forEach(track => {
        if (!allTracks.find(t => t.id === track.id) && allTracks.length < songCount) {
          allTracks.push(track);
        }
      });
    }

    console.log('Final track count:', allTracks.length);
    return allTracks.slice(0, songCount);
  }

  // Generate a playlist with real Spotify tracks
  public async generatePlaylist(
    emojis: string[],
    songCount: number,
    vibe: string
  ): Promise<GeneratedPlaylist> {
    // Filter valid emojis but don't require them
    const validEmojis = emojis.filter(emoji => ALL_MOOD_EMOJIS.includes(emoji));
    
    // First, generate playlist info using OpenAI
    const playlistInfo = await generatePlaylistInfo({
      emojis: validEmojis,
      songCount,
      vibe,
    });

    // Map emojis to genres (if any emojis provided)
    const genres = validEmojis.length > 0 ? this.mapEmojisToGenres(validEmojis) : [];
    
    // Map vibe to Spotify parameters
    const vibeParams = this.mapVibeToParameters(vibe);
    
    // Generate search queries
    const searchQueries = this.generateSearchQueries(vibe, playlistInfo.keywords);

    // Collect tracks from multiple sources
    const allTracks: SpotifyTrack[] = [];
    const trackUris: string[] = [];

    // 1. Get recommendations based on genres and vibe parameters
    if (genres.length > 0) {
      try {
        const recommendations = await spotifyService.getRecommendations({
          seed_genres: genres.slice(0, 5), // Spotify allows max 5 seed genres
          limit: Math.min(songCount, 20),
          ...vibeParams,
        });
        
        recommendations.tracks.forEach(track => {
          if (!allTracks.find(t => t.id === track.id)) {
            allTracks.push(track);
            trackUris.push(track.uri);
          }
        });
      } catch (error) {
        console.warn('Failed to get recommendations:', error);
      }
    }

    // 2. Search for tracks based on generated queries
    for (const query of searchQueries) {
      if (allTracks.length >= songCount) break;
      
      try {
        const searchResults = await spotifyService.search(
          query,
          ['track'],
          Math.min(10, songCount - allTracks.length)
        );
        
        searchResults.tracks.items.forEach(track => {
          if (!allTracks.find(t => t.id === track.id) && allTracks.length < songCount) {
            allTracks.push(track);
            trackUris.push(track.uri);
          }
        });
      } catch (error) {
        console.warn(`Failed to search for "${query}":`, error);
      }
    }

    // 3. If we still need more tracks, get popular tracks in the genres or search by vibe
    if (allTracks.length < songCount) {
      try {
        const searchQuery = genres.length > 0 ? genres[0] : vibe;
        const popularSearch = await spotifyService.search(
          searchQuery,
          ['track'],
          songCount - allTracks.length
        );
        
        popularSearch.tracks.items.forEach(track => {
          if (!allTracks.find(t => t.id === track.id) && allTracks.length < songCount) {
            allTracks.push(track);
            trackUris.push(track.uri);
          }
        });
      } catch (error) {
        console.warn('Failed to get popular tracks:', error);
      }
    }

    // Create the actual Spotify playlist
    let spotifyPlaylist;
    try {
      spotifyPlaylist = await spotifyService.createPlaylistWithTracks(
        playlistInfo.name,
        playlistInfo.description,
        trackUris.slice(0, songCount),
        true // public playlist
      );
    } catch (error) {
      console.error('Failed to create Spotify playlist:', error);
      throw new Error('Failed to create Spotify playlist. Please make sure you are logged into Spotify.');
    }

    return {
      id: spotifyPlaylist.id,
      name: playlistInfo.name,
      description: playlistInfo.description,
      colorPalette: playlistInfo.colorPalette,
      keywords: playlistInfo.keywords,
      emojis: validEmojis,
      songCount: allTracks.length,
      vibe,
      tracks: allTracks.slice(0, songCount),
      spotifyUrl: spotifyPlaylist.external_urls.spotify,
    };
  }
}

export const playlistGenerator = new PlaylistGenerator(); 