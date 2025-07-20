import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserPlaylists, savePlaylistToFirestore, deletePlaylist, PlaylistData } from '../../services/playlistService';

export const useSavedPlaylists = () => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<PlaylistData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlaylists = useCallback(async () => {
    if (!user?.uid) {
      setPlaylists([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Force refresh user token
      await user.getIdToken(true);
      console.log('🔄 Refreshed user token');
      
      const userPlaylists = await getUserPlaylists(user.uid);
      setPlaylists(userPlaylists);
    } catch (err: any) {
      console.error('Error loading playlists:', err);
      
      // Handle specific Firestore errors
      if (err?.code === 'permission-denied') {
        setError('Database not set up yet. Please create Firestore database in test mode.');
      } else if (err?.code === 'unavailable') {
        setError('Database temporarily unavailable. Please try again.');
      } else if (err?.message === 'User not authenticated') {
        setError('Please sign in again to access your playlists.');
      } else {
        setError('Failed to load playlists');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const savePlaylist = useCallback(async (playlistData: Omit<PlaylistData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      const playlistId = await savePlaylistToFirestore(playlistData, user.uid);
      
      // Add the new playlist to the local state
      const newPlaylist: PlaylistData = {
        ...playlistData,
        id: playlistId,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setPlaylists(prev => [newPlaylist, ...prev]);
      return playlistId;
    } catch (err) {
      console.error('Error saving playlist:', err);
      throw err;
    }
  }, [user?.uid]);

  const removePlaylist = useCallback(async (playlistId: string) => {
    try {
      await deletePlaylist(playlistId);
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    } catch (err) {
      console.error('Error deleting playlist:', err);
      throw err;
    }
  }, []);

  // Load playlists when user changes
  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  return {
    playlists,
    loading,
    error,
    loadPlaylists,
    savePlaylist,
    removePlaylist,
  };
}; 