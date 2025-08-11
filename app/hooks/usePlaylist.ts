import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playlistService, PlaylistData } from '../../services/playlistService';

export const usePlaylist = () => {
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number; phase: string } | null>(null);

  // Generate playlist with one simple function call
  const generatePlaylist = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    setGenerationProgress(null);

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

      console.log('Starting playlist generation with timeout protection');
      
      // Generate playlist with one call
      const playlist = await playlistService.generatePlaylist(emojis, songCount, vibe);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('playlistData', JSON.stringify(playlist));
      
      setPlaylistData(playlist);
    } catch (err) {
      console.error('Playlist generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate playlist';
      
      // Handle specific timeout errors
      if (errorMessage.includes('timeout')) {
        setError('Playlist generation took too long. Please try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      setGenerationProgress(null);
    }
  };

  // Generate playlist with streaming updates
  const generatePlaylistStreaming = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    setGenerationProgress(null);

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

      console.log('Starting streaming playlist generation');
      
      // Generate playlist with streaming updates
      const playlist = await playlistService.generatePlaylistStreaming(
        emojis, 
        songCount, 
        vibe,
        (partialPlaylist, progress) => {
          // Update playlist data with partial information
          setPlaylistData(prev => {
            if (!prev) {
              // If no previous data, create initial structure with required fields
              return {
                id: `temp-${Date.now()}`, // Temporary ID for loading state
                name: partialPlaylist.name || 'Loading...',
                description: partialPlaylist.description || 'Loading...',
                colorPalette: partialPlaylist.colorPalette || ['#6366f1', '#8b5cf6', '#a855f7'],
                keywords: partialPlaylist.keywords || [],
                coverImageUrl: partialPlaylist.coverImageUrl,
                emojis: partialPlaylist.emojis || [],
                songCount: partialPlaylist.songCount || 0,
                vibe: partialPlaylist.vibe || '',
                tracks: partialPlaylist.tracks || [],
                isSpotifyPlaylist: false,
              };
            }
            
            // Merge with existing data, ensuring required fields are preserved
            return {
              ...prev,
              ...partialPlaylist,
              // Ensure we don't lose existing tracks when updating
              tracks: partialPlaylist.tracks || prev.tracks,
              // Ensure required fields are never undefined
              name: partialPlaylist.name || prev.name,
              description: partialPlaylist.description || prev.description,
              colorPalette: partialPlaylist.colorPalette || prev.colorPalette,
              keywords: partialPlaylist.keywords || prev.keywords,
              emojis: partialPlaylist.emojis || prev.emojis,
              songCount: partialPlaylist.songCount || prev.songCount,
              vibe: partialPlaylist.vibe || prev.vibe,
            };
          });
          
          // Update progress
          setGenerationProgress(progress);
        }
      );
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('playlistData', JSON.stringify(playlist));
      
      setPlaylistData(playlist);
    } catch (err) {
      console.error('Playlist generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate playlist';
      
      // Handle specific timeout errors
      if (errorMessage.includes('timeout')) {
        setError('Playlist generation took too long. Please try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      setGenerationProgress(null);
    }
  };

  // Regenerate playlist with same parameters
  const regeneratePlaylist = async (): Promise<void> => {
    if (!playlistData) return;
    
    setLoading(true);
    setError(null);
    setGenerationProgress(null);

    try {
      const playlist = await playlistService.generatePlaylistStreaming(
        playlistData.emojis,
        playlistData.songCount,
        playlistData.vibe,
        (partialPlaylist, progress) => {
          // Update playlist data with partial information
          setPlaylistData(prev => {
            if (!prev) return null;
            
            return {
              ...prev,
              ...partialPlaylist,
              tracks: partialPlaylist.tracks || prev.tracks,
              name: partialPlaylist.name || prev.name,
              description: partialPlaylist.description || prev.description,
              colorPalette: partialPlaylist.colorPalette || prev.colorPalette,
              keywords: partialPlaylist.keywords || prev.keywords,
              emojis: partialPlaylist.emojis || prev.emojis,
              songCount: partialPlaylist.songCount || prev.songCount,
              vibe: partialPlaylist.vibe || prev.vibe,
            };
          });
          
          setGenerationProgress(progress);
        }
      );
      
      await AsyncStorage.setItem('playlistData', JSON.stringify(playlist));
      setPlaylistData(playlist);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate playlist';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setGenerationProgress(null);
    }
  };

  // Save to Spotify
  const saveToSpotify = async (): Promise<void> => {
    console.log('saveToSpotify hook called');
    if (!playlistData) {
      console.log('No playlist data, returning early');
      return;
    }
    // Do not setLoading or setPlaylistData to avoid UI refresh
    setError(null);
    console.log('About to call playlistService.saveToSpotify');

    try {
      console.log('Calling playlistService.saveToSpotify...');
      const result = await playlistService.saveToSpotify(playlistData);
      console.log('playlistService.saveToSpotify completed successfully:', result);
      // Optionally update AsyncStorage if you want, but don't update state
    } catch (err) {
      console.log('Error in saveToSpotify hook:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save to Spotify';
      console.log('Setting error message:', errorMessage);
      setError(errorMessage);
      throw err; // Re-throw so the calling function can catch it
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
    generationProgress,
    generatePlaylist,
    generatePlaylistStreaming,
    regeneratePlaylist,
    saveToSpotify,
    loadPlaylist,
    clearPlaylist,
  };
}; 