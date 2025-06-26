import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Buffer } from 'buffer';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '../env';

// Spotify API Types
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

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  external_urls: {
    spotify: string;
  };
  public: boolean;
  collaborative: boolean;
  owner: {
    id: string;
    display_name: string;
  };
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: SpotifyImage[];
  external_urls: {
    spotify: string;
  };
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
  artists: {
    items: SpotifyArtist[];
    total: number;
  };
  albums: {
    items: SpotifyAlbum[];
    total: number;
  };
  playlists: {
    items: SpotifyPlaylist[];
    total: number;
  };
}

export interface CreatePlaylistResponse {
  id: string;
  name: string;
  description: string;
  external_urls: {
    spotify: string;
  };
  public: boolean;
  collaborative: boolean;
}

// Simplified Spotify Service
class SpotifyService {
  private clientId: string;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  // Set up Spotify's OAuth endpoints
  private discovery = {
    authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  };

  // Scopes needed for playlist creation and management
  private scopes = [
    'user-read-private',
    'user-read-email',
    'playlist-modify-public',
    'playlist-modify-private',
    'playlist-read-private',
    'playlist-read-collaborative',
  ];

  // Use custom scheme URI (works with `npx expo run:ios`)
  private redirectUri = AuthSession.makeRedirectUri({
    scheme: 'vymix',
    path: 'auth'
  });

  constructor() {
    this.clientId = SPOTIFY_CLIENT_ID;
    this.loadTokens();
  }

  // Load stored tokens from AsyncStorage
  private async loadTokens(): Promise<void> {
    try {
      const accessToken = await AsyncStorage.getItem('spotify_access_token');
      const tokenExpiry = await AsyncStorage.getItem('spotify_token_expiry');

      if (accessToken && tokenExpiry) {
        this.accessToken = accessToken;
        this.tokenExpiry = parseInt(tokenExpiry);
      }
    } catch (error) {
      console.error('Error loading Spotify tokens:', error);
    }
  }

  // Save tokens to AsyncStorage
  private async saveTokens(accessToken: string, expiresIn: number): Promise<void> {
    try {
      const expiryTime = Date.now() + expiresIn * 1000;
      await AsyncStorage.setItem('spotify_access_token', accessToken);
      await AsyncStorage.setItem('spotify_token_expiry', expiryTime.toString());

      this.accessToken = accessToken;
      this.tokenExpiry = expiryTime;
    } catch (error) {
      console.error('Error saving Spotify tokens:', error);
    }
  }

  // Clear stored tokens
  private async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.removeItem('spotify_access_token');
      await AsyncStorage.removeItem('spotify_token_expiry');

      this.accessToken = null;
      this.tokenExpiry = null;
    } catch (error) {
      console.error('Error clearing Spotify tokens:', error);
    }
  }

  // Check if user has connected Spotify before
  public async hasConnectedSpotify(userId: string): Promise<boolean> {
    try {
      const connected = await AsyncStorage.getItem(`spotify_connected_${userId}`);
      const result = connected === 'true';
      return result;
    } catch (error) {
      console.error('Error checking Spotify connection status:', error);
      return false;
    }
  }

  // Mark user as having connected Spotify
  public async markAsConnected(userId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`spotify_connected_${userId}`, 'true');
    } catch (error) {
      console.error('Error marking user as connected:', error);
    }
  }

  // Clear Spotify connection status (for testing)
  public async clearConnectionStatus(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`spotify_connected_${userId}`);
    } catch (error) {
      console.error('Error clearing Spotify connection status:', error);
    }
  }

  // Login to Spotify using Expo AuthSession
  public async loginToSpotify(userId?: string): Promise<string> {
    const authUrl =
      `${this.discovery.authorizationEndpoint}` +
      `?client_id=${this.clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
      `&scope=${encodeURIComponent(this.scopes.join(' '))}`;

    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, this.redirectUri);

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        
        if (code) {
          const accessToken = await this.exchangeCodeForToken(code);
          
          // Mark user as connected if userId provided
          if (userId) {
            console.log('Marking user as connected after successful login:', userId);
            await this.markAsConnected(userId);
          }
          
          return accessToken;
        }
      } else if (result.type === 'cancel') {
        throw new Error('Spotify login was cancelled');
      }
    } catch (error) {
      console.error('Spotify login error:', error);
      throw error;
    }

    throw new Error('Spotify login failed');
  }

  // Exchange authorization code for access token
  private async exchangeCodeForToken(code: string): Promise<string> {
    const authHeader = `Basic ${Buffer.from(`${this.clientId}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`;
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const { access_token, expires_in } = data;
    await this.saveTokens(access_token, expires_in);
    
    return access_token;
  }

  // Get valid access token (check if expired)
  private async getValidAccessToken(): Promise<string> {
    if (!this.accessToken) {
      throw new Error('No access token available. Please authenticate first.');
    }

    // Check if token is expired (with 5 minute buffer)
    if (this.tokenExpiry && Date.now() > this.tokenExpiry - 300000) {
      await this.clearTokens();
      throw new Error('Access token expired. Please login again.');
    }

    return this.accessToken;
  }

  // Make authenticated API request
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const accessToken = await this.getValidAccessToken();

    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.clearTokens();
        throw new Error('Authentication required. Please login again.');
      }
      throw new Error(`Spotify API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Get current user profile
  public async getCurrentUser(): Promise<SpotifyUser> {
    return this.makeRequest<SpotifyUser>('/me');
  }

  // Search for tracks, artists, albums, or playlists
  public async search(
    query: string,
    types: ('track' | 'artist' | 'album' | 'playlist')[] = ['track'],
    limit: number = 20,
    offset: number = 0
  ): Promise<SpotifySearchResponse> {
    const params = new URLSearchParams({
      q: query,
      type: types.join(','),
      limit: limit.toString(),
      offset: offset.toString(),
    });

    return this.makeRequest<SpotifySearchResponse>(`/search?${params.toString()}`);
  }

  // Get recommendations based on various parameters
  public async getRecommendations(params: {
    seed_artists?: string[];
    seed_tracks?: string[];
    seed_genres?: string[];
    target_energy?: number;
    target_danceability?: number;
    target_valence?: number;
    target_tempo?: number;
    target_acousticness?: number;
    target_instrumentalness?: number;
    target_liveness?: number;
    target_loudness?: number;
    target_speechiness?: number;
    min_energy?: number;
    max_energy?: number;
    min_danceability?: number;
    max_danceability?: number;
    min_valence?: number;
    max_valence?: number;
    limit?: number;
  }): Promise<{
    tracks: SpotifyTrack[];
  }> {
    const searchParams = new URLSearchParams();
    
    if (params.seed_artists) searchParams.append('seed_artists', params.seed_artists.join(','));
    if (params.seed_tracks) searchParams.append('seed_tracks', params.seed_tracks.join(','));
    if (params.seed_genres) searchParams.append('seed_genres', params.seed_genres.join(','));
    if (params.target_energy) searchParams.append('target_energy', params.target_energy.toString());
    if (params.target_danceability) searchParams.append('target_danceability', params.target_danceability.toString());
    if (params.target_valence) searchParams.append('target_valence', params.target_valence.toString());
    if (params.target_tempo) searchParams.append('target_tempo', params.target_tempo.toString());
    if (params.target_acousticness) searchParams.append('target_acousticness', params.target_acousticness.toString());
    if (params.target_instrumentalness) searchParams.append('target_instrumentalness', params.target_instrumentalness.toString());
    if (params.target_liveness) searchParams.append('target_liveness', params.target_liveness.toString());
    if (params.target_loudness) searchParams.append('target_loudness', params.target_loudness.toString());
    if (params.target_speechiness) searchParams.append('target_speechiness', params.target_speechiness.toString());
    if (params.min_energy) searchParams.append('min_energy', params.min_energy.toString());
    if (params.max_energy) searchParams.append('max_energy', params.max_energy.toString());
    if (params.min_danceability) searchParams.append('min_danceability', params.min_danceability.toString());
    if (params.max_danceability) searchParams.append('max_danceability', params.max_danceability.toString());
    if (params.min_valence) searchParams.append('min_valence', params.min_valence.toString());
    if (params.max_valence) searchParams.append('max_valence', params.max_valence.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    return this.makeRequest(`/recommendations?${searchParams.toString()}`);
  }

  // Create a new playlist
  public async createPlaylist(
    name: string,
    description: string,
    isPublic: boolean = true
  ): Promise<CreatePlaylistResponse> {
    const user = await this.getCurrentUser();
    
    const response = await this.makeRequest<CreatePlaylistResponse>(`/users/${user.id}/playlists`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        public: isPublic,
        collaborative: false,
      }),
    });

    return response;
  }

  // Add tracks to a playlist
  public async addTracksToPlaylist(
    playlistId: string,
    trackUris: string[]
  ): Promise<{ snapshot_id: string }> {
    return this.makeRequest(`/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({
        uris: trackUris,
      }),
    });
  }

  // Create a complete playlist with tracks
  public async createPlaylistWithTracks(
    name: string,
    description: string,
    trackUris: string[],
    isPublic: boolean = true
  ): Promise<CreatePlaylistResponse> {
    const playlist = await this.createPlaylist(name, description, isPublic);
    
    if (trackUris.length > 0) {
      await this.addTracksToPlaylist(playlist.id, trackUris);
    }
    
    return playlist;
  }

  // Get user's playlists
  public async getUserPlaylists(limit: number = 20, offset: number = 0): Promise<{
    items: SpotifyPlaylist[];
    total: number;
  }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    return this.makeRequest(`/me/playlists?${params.toString()}`);
  }

  // Get track details
  public async getTrack(trackId: string): Promise<SpotifyTrack> {
    return this.makeRequest<SpotifyTrack>(`/tracks/${trackId}`);
  }

  // Get artist details
  public async getArtist(artistId: string): Promise<SpotifyArtist> {
    return this.makeRequest<SpotifyArtist>(`/artists/${artistId}`);
  }

  // Get artist's top tracks
  public async getArtistTopTracks(artistId: string, market: string = 'US'): Promise<{
    tracks: SpotifyTrack[];
  }> {
    return this.makeRequest(`/artists/${artistId}/top-tracks?market=${market}`);
  }

  // Get available genres for recommendations
  public async getAvailableGenres(): Promise<{
    genres: string[];
  }> {
    return this.makeRequest('/recommendations/available-genre-seeds');
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    if (!this.accessToken) {
      return false;
    }
    
    // Check if token is expired (with 5 minute buffer)
    if (this.tokenExpiry && Date.now() > this.tokenExpiry - 300000) {
      this.clearTokens();
      return false;
    }
    
    return true;
  }

  // Logout (clear tokens)
  public async logout(): Promise<void> {
    await this.clearTokens();
  }

  // Get redirect URI for debugging
  public getRedirectUri(): string {
    return this.redirectUri;
  }
}

// Export singleton instance
export const spotifyService = new SpotifyService(); 