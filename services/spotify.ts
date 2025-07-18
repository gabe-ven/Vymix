import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as ImageManipulator from 'expo-image-manipulator';
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
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;
  private isInitialized: boolean = false;

  // Set up Spotify's OAuth endpoints
  private discovery = {
    authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  };

  // Scopes needed for playlist creation and management
  private scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'playlist-modify-public',
    'playlist-modify-private',
    'playlist-read-private',
    'playlist-read-collaborative',
    'ugc-image-upload',
  ];

  // Use custom scheme URI (works with `npx expo run:ios`)
  private redirectUri = AuthSession.makeRedirectUri({
    scheme: 'vymix',
    path: 'auth'
  });

  constructor() {
    this.clientId = SPOTIFY_CLIENT_ID;
    // Don't call loadTokens here - it will be called when needed
  }

  // Initialize the service (load tokens from storage)
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.loadTokens();
      this.isInitialized = true;
      console.log('Spotify service initialized');
    } catch (error) {
      console.error('Failed to initialize Spotify service:', error);
    }
  }

  // Load stored tokens from AsyncStorage
  private async loadTokens(): Promise<void> {
    try {
      const accessToken = await AsyncStorage.getItem('spotify_access_token');
      const refreshToken = await AsyncStorage.getItem('spotify_refresh_token');
      const tokenExpiry = await AsyncStorage.getItem('spotify_token_expiry');

      // Load tokens if we have either access token or refresh token
      if (accessToken || refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiry = tokenExpiry ? parseInt(tokenExpiry) : null;
        
        console.log('Loaded tokens from storage:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasExpiry: !!tokenExpiry
        });
      }
    } catch (error) {
      console.error('Error loading Spotify tokens:', error);
    }
  }

  // Save tokens to AsyncStorage
  private async saveTokens(accessToken: string, expiresIn: number, refreshToken?: string): Promise<void> {
    try {
      const expiryTime = Date.now() + (expiresIn * 1000);
      
      await AsyncStorage.setItem('spotify_access_token', accessToken);
      await AsyncStorage.setItem('spotify_token_expiry', expiryTime.toString());
      
      // Only update refresh token if a new one is provided
      if (refreshToken) {
        await AsyncStorage.setItem('spotify_refresh_token', refreshToken);
        this.refreshToken = refreshToken;
      }
      
      this.accessToken = accessToken;
      this.tokenExpiry = expiryTime;
      
      console.log('Saved tokens to storage:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!this.refreshToken,
        expiresIn: expiresIn,
        expiryTime: new Date(expiryTime).toISOString()
      });
    } catch (error) {
      console.error('Error saving Spotify tokens:', error);
    }
  }

  // Clear tokens from AsyncStorage
  private async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.removeItem('spotify_access_token');
      await AsyncStorage.removeItem('spotify_refresh_token');
      await AsyncStorage.removeItem('spotify_token_expiry');
      
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiry = null;
      this.isInitialized = false;
      
      console.log('Cleared all Spotify tokens');
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
    // Ensure service is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

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
    const { access_token, refresh_token, expires_in } = data;
    await this.saveTokens(access_token, expires_in, refresh_token);
    
    return access_token;
  }

  // Refresh access token using refresh token
  private async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available. Please login again.');
    }

    console.log('Refreshing access token...');

    const authHeader = `Basic ${Buffer.from(`${this.clientId}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`;
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', errorText);
      // If refresh fails, clear tokens and require re-authentication
      await this.clearTokens();
      throw new Error('Token refresh failed. Please login again.');
    }

    const data = await response.json();
    const { access_token, expires_in, refresh_token } = data;
    
    // Spotify may or may not return a new refresh_token
    // If it does, use the new one; otherwise keep the existing one
    const newRefreshToken = refresh_token || this.refreshToken;
    
    await this.saveTokens(access_token, expires_in, newRefreshToken);
    
    console.log('Successfully refreshed access token');
    return access_token;
  }

  // Get valid access token (check if expired and refresh if needed)
  private async getValidAccessToken(): Promise<string> {
    // Ensure service is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.accessToken && !this.refreshToken) {
      throw new Error('No access token available. Please authenticate first.');
    }

    // If we have a refresh token but no access token, try to refresh
    if (!this.accessToken && this.refreshToken) {
      try {
        console.log('No access token, attempting to refresh...');
        return await this.refreshAccessToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
        await this.clearTokens();
        throw new Error('Access token expired and refresh failed. Please login again.');
      }
    }

    // Check if token is expired (with 5 minute buffer)
    if (this.tokenExpiry && Date.now() > this.tokenExpiry - 300000) {
      // Try to refresh the token with timeout
      try {
        console.log('Access token expired, attempting to refresh...');
        const refreshPromise = this.refreshAccessToken();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Token refresh timeout')), 10000)
        );
        
        return await Promise.race([refreshPromise, timeoutPromise]) as string;
      } catch (error) {
        console.error('Failed to refresh token:', error);
        await this.clearTokens();
        throw new Error('Access token expired and refresh failed. Please login again.');
      }
    }

    return this.accessToken!;
  }

  // Make authenticated API request
  public async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const accessToken = await this.getValidAccessToken();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearTokens();
          throw new Error('Authentication required. Please login again.');
        }
        
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
        
        console.error(`Spotify API error for endpoint ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          errorDetails,
          url: `https://api.spotify.com/v1${endpoint}`
        });
        
        throw new Error(`Spotify API error: ${errorDetails}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      throw error;
    }
  }

  // Get recommendations from Spotify
  public async getRecommendations(params: {
    seed_tracks?: string[];
    seed_genres?: string[];
    seed_artists?: string[];
    target_energy?: number;
    target_valence?: number;
    target_danceability?: number;
    target_acousticness?: number;
    target_instrumentalness?: number;
    limit?: number;
    market?: string;
  }): Promise<{ tracks: SpotifyTrack[] }> {
    const queryParams = new URLSearchParams();
    
    if (params.seed_tracks) {
      queryParams.append('seed_tracks', params.seed_tracks.join(','));
    }
    if (params.seed_genres) {
      queryParams.append('seed_genres', params.seed_genres.join(','));
    }
    if (params.seed_artists) {
      queryParams.append('seed_artists', params.seed_artists.join(','));
    }
    if (params.target_energy !== undefined) {
      queryParams.append('target_energy', params.target_energy.toString());
    }
    if (params.target_valence !== undefined) {
      queryParams.append('target_valence', params.target_valence.toString());
    }
    if (params.target_danceability !== undefined) {
      queryParams.append('target_danceability', params.target_danceability.toString());
    }
    if (params.target_acousticness !== undefined) {
      queryParams.append('target_acousticness', params.target_acousticness.toString());
    }
    if (params.target_instrumentalness !== undefined) {
      queryParams.append('target_instrumentalness', params.target_instrumentalness.toString());
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.market) {
      queryParams.append('market', params.market);
    }
    
    return this.makeRequest<{ tracks: SpotifyTrack[] }>(`/recommendations?${queryParams.toString()}`);
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

  // Upload cover image to a playlist
  public async uploadPlaylistCoverImage(
    playlistId: string,
    imageUrl: string
  ): Promise<void> {
    try {
      console.log(`🖼️ Uploading cover image to playlist ${playlistId}`);
      
      // Download the image from the URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }
      
      // Get the image as arrayBuffer first
      const arrayBuffer = await imageResponse.arrayBuffer();
      const originalSize = arrayBuffer.byteLength;
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      
      console.log(`📏 Original image size: ${(originalSize / 1024).toFixed(2)}KB`);
      
      const maxSizeBytes = 200 * 1024; // 200KB - more conservative for faster uploads
      let finalBase64: string;
      
      if (originalSize > maxSizeBytes) {
        console.log(`📦 Image too large, compressing...`);
        try {
          finalBase64 = await this.compressImageFromUrl(imageUrl, maxSizeBytes);
        } catch (error) {
          console.warn('Failed to compress image, skipping cover upload:', error);
          return; // Skip cover upload if compression fails
        }
      } else {
        // Convert to base64 directly
        finalBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      }
      
      // Final size check - if still too large, skip upload
      const finalSize = (finalBase64.length * 0.75);
      if (finalSize > 200 * 1024) {
        console.warn(`⚠️ Image still too large (${(finalSize / 1024).toFixed(2)}KB), skipping cover upload`);
        return;
      }
      
      // Upload to Spotify with extended timeout for large images
      await this.uploadImageWithTimeout(playlistId, finalBase64);
      
      console.log(`✅ Successfully uploaded cover image to playlist ${playlistId}`);
    } catch (error) {
      console.error(`❌ Failed to upload cover image to playlist ${playlistId}:`, error);
      // Don't throw the error - playlist creation should still succeed even if cover upload fails
    }
  }

  // Upload image with extended timeout for large base64 data
  private async uploadImageWithTimeout(playlistId: string, base64Data: string): Promise<void> {
    const accessToken = await this.getValidAccessToken();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for image uploads

    try {
      console.log(`📤 Uploading ${(base64Data.length * 0.75 / 1024).toFixed(2)}KB image to Spotify...`);
      
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/images`, {
        method: 'PUT',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'image/jpeg',
        },
        body: base64Data, // Send raw base64 data, not wrapped in JSON
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearTokens();
          throw new Error('Authentication required. Please login again.');
        }
        
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
        
        console.error(`Spotify image upload error:`, {
          status: response.status,
          statusText: response.statusText,
          errorDetails,
          playlistId
        });
        
        throw new Error(`Spotify image upload error: ${errorDetails}`);
      }

      console.log(`✅ Image upload successful for playlist ${playlistId}`);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Image upload timeout. The image might be too large.');
      }
      throw error;
    }
  }

  // Compress image to fit within size limit using React Native ImageManipulator
  private async compressImageFromUrl(imageUrl: string, maxSizeBytes: number): Promise<string> {
    try {
      // Spotify recommends 300x300 minimum, 3000x3000 maximum
      const maxDimension = 3000;
      const minDimension = 300;
      
      // Try different quality levels to get under 256KB - be more aggressive
      const qualityLevels = [0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.05];
      let width = 800; // Start smaller for faster uploads
      let height = 800;
      
      for (const quality of qualityLevels) {
        try {
          const result = await ImageManipulator.manipulateAsync(
            imageUrl, // Use the URL directly
            [
              {
                resize: {
                  width: Math.max(minDimension, Math.min(maxDimension, width)),
                  height: Math.max(minDimension, Math.min(maxDimension, height))
                }
              }
            ],
            {
              compress: quality,
              format: ImageManipulator.SaveFormat.JPEG,
              base64: true
            }
          );
          
          const compressedBase64 = result.base64 || '';
          // Estimate size (base64 is about 33% larger than binary)
          const estimatedSize = (compressedBase64.length * 0.75);
          
          console.log(`📏 Quality ${quality}: ${(estimatedSize / 1024).toFixed(2)}KB`);
          
          if (estimatedSize <= maxSizeBytes) {
            console.log(`✅ Compressed with quality ${quality}, size: ${(estimatedSize / 1024).toFixed(2)}KB`);
            return compressedBase64;
          }
          
          // If still too large, reduce dimensions for next iteration
          width = Math.floor(width * 0.8);
          height = Math.floor(height * 0.8);
          
        } catch (error) {
          console.warn(`Failed to compress with quality ${quality}:`, error);
          continue;
        }
      }
      
      // If all quality levels failed, try with lowest quality and smallest size
      console.log(`⚠️ Trying lowest quality with minimal size...`);
      const finalResult = await ImageManipulator.manipulateAsync(
        imageUrl,
        [
          {
            resize: {
              width: minDimension,
              height: minDimension
            }
          }
        ],
        {
          compress: 0.05,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true
        }
      );
      
      const finalBase64 = finalResult.base64 || '';
      const estimatedSize = (finalBase64.length * 0.75);
      
      console.log(`⚠️ Using lowest quality, size: ${(estimatedSize / 1024).toFixed(2)}KB`);
      return finalBase64;
      
    } catch (error) {
      console.error('Failed to compress image:', error);
      throw new Error('Failed to compress image for Spotify upload');
    }
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

  // Check if user is authenticated
  public async isAuthenticated(): Promise<boolean> {
    // Ensure service is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check if we have an access token that's not expired
    if (this.accessToken && this.tokenExpiry && Date.now() <= this.tokenExpiry - 300000) {
      return true;
    }
    
    // Check if we have a refresh token (can refresh expired access token)
    if (this.refreshToken) {
      return true;
    }
    
    return false;
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