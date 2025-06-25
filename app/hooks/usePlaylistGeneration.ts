import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generatePlaylistInfo, generatePlaylistCover } from '../../services/openai';

interface PlaylistData {
  name: string;
  description: string;
  colorPalette: string[];
  keywords: string[];
  coverImageUrl?: string;
  emojis: string[];
  songCount: number;
  vibe: string;
}

interface UsePlaylistGenerationReturn {
  playlistData: PlaylistData | null;
  loading: boolean;
  error: string | null;
  generatePlaylist: () => Promise<void>;
  resetPlaylist: () => void;
}

export const usePlaylistGeneration = (): UsePlaylistGenerationReturn => {
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const retrieveStoredData = async (): Promise<{ emojis: string[]; songCount: number; vibe: string } | null> => {
    try {
      const [emojisData, songCountData, vibeData] = await Promise.all([
        AsyncStorage.getItem('selectedEmojis'),
        AsyncStorage.getItem('songCount'),
        AsyncStorage.getItem('currentVibe'),
      ]);

      const emojis = emojisData ? JSON.parse(emojisData) : [];
      const songCount = songCountData ? parseInt(songCountData, 10) : 10;
      const vibe = vibeData || 'Feeling good';

      return { emojis, songCount, vibe };
    } catch (err) {
      console.error('Error retrieving stored data:', err);
      return null;
    }
  };

  const generatePlaylist = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const storedData = await retrieveStoredData();
      
      if (!storedData) {
        throw new Error('No stored data found. Please go back and select your vibe, emojis, and song count.');
      }

      const { emojis, songCount, vibe } = storedData;
      
      // Use real OpenAI API
      const result = await generatePlaylistInfo({
        emojis,
        songCount,
        vibe,
      });
      
      // Generate cover image using DALL-E
      let coverImageUrl: string | undefined;
      try {
        coverImageUrl = await generatePlaylistCover(emojis, vibe, result.name, result.colorPalette);
      } catch (coverError) {
        console.warn('Failed to generate cover image:', coverError);
        // Continue without cover image if generation fails
      }
      
      setPlaylistData({
        name: result.name,
        description: result.description,
        colorPalette: result.colorPalette,
        keywords: result.keywords,
        coverImageUrl,
        emojis,
        songCount,
        vibe,
      });
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to generate playlist';
      
      setError(errorMessage);
      console.error('Playlist generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetPlaylist = (): void => {
    setPlaylistData(null);
    setError(null);
  };

  // Auto-generate playlist when hook is first used
  useEffect(() => {
    if (!playlistData && !loading && !error) {
      generatePlaylist();
    }
  }, []);

  return {
    playlistData,
    loading,
    error,
    generatePlaylist,
    resetPlaylist,
  };
}; 