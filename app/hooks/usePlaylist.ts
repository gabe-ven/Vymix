import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playlistService, PlaylistData } from '../../services/playlistService';

export const usePlaylist = () => {
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate playlist with one simple function call
  const generatePlaylist = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Get stored data
      const [emojisData, songCountData, vibeData] = await Promise.all([
        AsyncStorage.getItem('selectedEmojis'),
        AsyncStorage.getItem('songCount'),
        AsyncStorage.getItem('currentVibe'),
      ]);

      const emojis = emojisData ? JSON.parse(emojisData) : [];
      const songCount = songCountData ? parseInt(songCountData, 10) : 10;
      const vibe = vibeData || 'Feeling good';

      // Generate playlist with one call
      const playlist = await playlistService.generatePlaylist(emojis, songCount, vibe);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('playlistData', JSON.stringify(playlist));
      
      setPlaylistData(playlist);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate playlist';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Regenerate playlist with same parameters
  const regeneratePlaylist = async (): Promise<void> => {
    if (!playlistData) return;
    
    setLoading(true);
    setError(null);

    try {
      const playlist = await playlistService.generatePlaylist(
        playlistData.emojis,
        playlistData.songCount,
        playlistData.vibe
      );
      
      await AsyncStorage.setItem('playlistData', JSON.stringify(playlist));
      setPlaylistData(playlist);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate playlist';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Save to Spotify
  const saveToSpotify = async (): Promise<void> => {
    if (!playlistData) return;
    
    setLoading(true);
    setError(null);

    try {
      const savedPlaylist = await playlistService.saveToSpotify(playlistData);
      await AsyncStorage.setItem('playlistData', JSON.stringify(savedPlaylist));
      setPlaylistData(savedPlaylist);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save to Spotify';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load playlist from storage
  const loadPlaylist = async (): Promise<void> => {
    try {
      const data = await AsyncStorage.getItem('playlistData');
      if (data) {
        setPlaylistData(JSON.parse(data));
      }
    } catch (err) {
      console.error('Failed to load playlist:', err);
    }
  };

  // Clear playlist
  const clearPlaylist = (): void => {
    setPlaylistData(null);
    setError(null);
  };

  return {
    playlistData,
    loading,
    error,
    generatePlaylist,
    regeneratePlaylist,
    saveToSpotify,
    loadPlaylist,
    clearPlaylist,
  };
}; 