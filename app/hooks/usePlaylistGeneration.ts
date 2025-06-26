import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generatePlaylistInfo, generatePlaylistCover } from '../../services/openai';
import { playlistGenerator, GeneratedPlaylist } from '../../services/playlistGenerator';
import { spotifyService } from '../../services/spotify';

interface PlaylistData {
  name: string;
  description: string;
  colorPalette: string[];
  keywords: string[];
  coverImageUrl?: string;
  emojis: string[];
  songCount: number;
  vibe: string;
  tracks: any[];
  spotifyUrl?: string;
  id?: string;
  isSpotifyPlaylist?: boolean;
}

interface UsePlaylistGenerationReturn {
  playlistData: PlaylistData | null;
  loading: boolean;
  error: string | null;
  generatePlaylist: () => Promise<void>;
  resetPlaylist: () => void;
  saveToSpotify: () => Promise<void>;
}

export const usePlaylistGeneration = (): UsePlaylistGenerationReturn => {
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const retrieveStoredData = async (): Promise<{ emojis: string[]; songCount: number; vibe: string } | null> => {
    try {
      console.log('Retrieving data from AsyncStorage...');
      const [emojisData, songCountData, vibeData] = await Promise.all([
        AsyncStorage.getItem('selectedEmojis'),
        AsyncStorage.getItem('songCount'),
        AsyncStorage.getItem('currentVibe'),
      ]);

      console.log('Raw data from AsyncStorage:', { emojisData, songCountData, vibeData });

      const emojis = emojisData ? JSON.parse(emojisData) : [];
      const songCount = songCountData ? parseInt(songCountData, 10) : 10;
      const vibe = vibeData || 'Feeling good';

      console.log('Parsed data:', { emojis, songCount, vibe });

      return { emojis, songCount, vibe };
    } catch (err) {
      console.error('Error retrieving stored data:', err);
      return null;
    }
  };

  const generatePlaylist = async (): Promise<void> => {
    console.log('=== PLAYLIST GENERATION STARTED ===');
    setLoading(true);
    setError(null);

    try {
      console.log('Retrieving stored data...');
      const storedData = await retrieveStoredData();
      console.log('Stored data retrieved:', storedData);
      
      if (!storedData) {
        console.log('No stored data found, throwing error');
        throw new Error('No stored data found. Please go back and select your vibe, emojis, and song count.');
      }

      const { emojis, songCount, vibe } = storedData;
      console.log('Processing with:', { emojis, songCount, vibe });
      
      // Generate playlist info using OpenAI
      console.log('Generating playlist info with OpenAI...');
      const playlistInfo = await generatePlaylistInfo({
        emojis,
        songCount,
        vibe,
      });
      console.log('Playlist info generated:', playlistInfo);
      
      // Generate cover image using DALL-E
      let coverImageUrl: string | undefined;
      try {
        console.log('Generating cover image...');
        coverImageUrl = await generatePlaylistCover(emojis, vibe, playlistInfo.name, playlistInfo.colorPalette);
        console.log('Cover image generated:', coverImageUrl);
      } catch (coverError) {
        console.warn('Failed to generate cover image:', coverError);
        // Continue without cover image if generation fails
      }
      
      // Generate real Spotify tracks (no authentication required for this)
      let realTracks = [];
      try {
        console.log('Generating real Spotify tracks...');
        realTracks = await playlistGenerator.generateTracksOnly(
          emojis,
          songCount,
          vibe
        );
        console.log('Generated tracks:', realTracks.length);
      } catch (trackError) {
        console.error('Failed to generate real tracks:', trackError);
        throw new Error('Failed to generate tracks from Spotify. Please try again.');
      }
      
      console.log('Setting playlist data with tracks:', realTracks.length);
      const newPlaylistData = {
        name: playlistInfo.name,
        description: playlistInfo.description,
        colorPalette: playlistInfo.colorPalette,
        keywords: playlistInfo.keywords,
        coverImageUrl,
        emojis,
        songCount: realTracks.length,
        vibe,
        tracks: realTracks,
        isSpotifyPlaylist: false,
      };
      console.log('New playlist data to be set:', newPlaylistData);
      setPlaylistData(newPlaylistData);
      console.log('=== PLAYLIST GENERATION COMPLETED SUCCESSFULLY ===');
    } catch (err) {
      console.error('=== PLAYLIST GENERATION FAILED ===');
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to generate playlist';
      
      setError(errorMessage);
      console.error('Playlist generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveToSpotify = async (): Promise<void> => {
    if (!playlistData) {
      throw new Error('No playlist data available');
    }

    // Check if user is authenticated with Spotify
    if (!spotifyService.isAuthenticated()) {
      throw new Error('Please connect to Spotify to save your playlist. You can do this in your profile settings.');
    }

    setLoading(true);
    setError(null);

    try {
      // Create the actual Spotify playlist
      const result: GeneratedPlaylist = await playlistGenerator.generatePlaylist(
        playlistData.emojis,
        playlistData.songCount,
        playlistData.vibe
      );
      
      // Update the playlist data with Spotify information
      setPlaylistData({
        ...playlistData,
        id: result.id,
        tracks: result.tracks,
        spotifyUrl: result.spotifyUrl,
        isSpotifyPlaylist: true,
      });
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to save playlist to Spotify';
      
      setError(errorMessage);
      console.error('Spotify save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetPlaylist = (): void => {
    setPlaylistData(null);
    setError(null);
  };

  // Debug: Monitor playlist data changes
  useEffect(() => {
    console.log('Playlist data changed:', playlistData);
    if (playlistData) {
      console.log('Playlist data details:', {
        name: playlistData.name,
        songCount: playlistData.songCount,
        tracksLength: playlistData.tracks?.length,
        tracks: playlistData.tracks
      });
    }
  }, [playlistData]);

  return {
    playlistData,
    loading,
    error,
    generatePlaylist,
    resetPlaylist,
    saveToSpotify,
  };
}; 