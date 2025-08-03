import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserPlaylists, savePlaylistToFirestore, deletePlaylist, PlaylistData } from '../../services/playlistService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache for playlists to avoid repeated Firestore calls
const playlistCache = new Map<string, { playlists: PlaylistData[]; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes - much longer cache
const CACHE_KEY_PREFIX = 'playlist_cache_';

// Load cache from AsyncStorage on app start
const initializeCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    
    for (const key of cacheKeys) {
      const userId = key.replace(CACHE_KEY_PREFIX, '');
      const cachedData = await AsyncStorage.getItem(key);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          // Convert date strings back to Date objects
          parsed.playlists = parsed.playlists.map((playlist: any) => ({
            ...playlist,
            createdAt: new Date(playlist.createdAt),
            updatedAt: new Date(playlist.updatedAt),
          }));
          playlistCache.set(userId, parsed);
          console.log('📦 Loaded cached playlists for user:', userId, parsed.playlists.length);
        } catch (parseError) {
          console.error('Error parsing cached data for user:', userId, parseError);
          // Remove corrupted cache entry
          await AsyncStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.error('Error loading cache from storage:', error);
  }
};

// Save cache to AsyncStorage
const saveCacheToStorage = async (userId: string, data: { playlists: PlaylistData[]; timestamp: number }) => {
  try {
    await AsyncStorage.setItem(CACHE_KEY_PREFIX + userId, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving cache to storage:', error);
  }
};

// Initialize cache when module loads
initializeCache();

export const useSavedPlaylists = () => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<PlaylistData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastUserId = useRef<string | null>(null);
  const isInitialized = useRef(false);

  const loadPlaylists = useCallback(async (forceRefresh = false) => {
    if (!user?.uid) {
      setPlaylists([]);
      return;
    }

    console.log('🔄 loadPlaylists called:', { forceRefresh, userId: user.uid });

    // Check if we have cached data and it's still valid
    const cached = playlistCache.get(user.uid);
    const now = Date.now();
    
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('📦 Using cached playlists:', cached.playlists.length);
      setPlaylists(cached.playlists);
      setLoading(false);
      setError(null);
      return;
    }

    console.log('🌐 Fetching fresh playlists from Firestore');
    
    // Only show loading if we don't have cached data
    if (!cached) {
      setLoading(true);
    }
    setError(null);

    try {
      // Force refresh user token
      await user.getIdToken(true);
      console.log('🔄 Refreshed user token');
      
      const userPlaylists = await getUserPlaylists(user.uid);
      console.log('✅ Fetched playlists:', userPlaylists.length);
      
      // Cache the results
      const cacheData = {
        playlists: userPlaylists,
        timestamp: now
      };
      playlistCache.set(user.uid, cacheData);
      
      // Save to persistent storage
      await saveCacheToStorage(user.uid, cacheData);
      
      setPlaylists(userPlaylists);
    } catch (err: any) {
      console.error('Error loading playlists:', err);
      
      // If we have cached data but it's expired, use it as fallback
      if (cached && cached.playlists.length > 0) {
        console.log('⚠️ Using expired cache as fallback:', cached.playlists.length);
        setPlaylists(cached.playlists);
        setLoading(false);
        setError(null);
        return;
      }
      
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
      
      // Update cache
      const cached = playlistCache.get(user.uid);
      if (cached) {
        const updatedCache = {
          playlists: [newPlaylist, ...cached.playlists],
          timestamp: Date.now()
        };
        playlistCache.set(user.uid, updatedCache);
        await saveCacheToStorage(user.uid, updatedCache);
      }
      
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
      
      // Update cache
      if (user?.uid) {
        const cached = playlistCache.get(user.uid);
        if (cached) {
          const updatedCache = {
            playlists: cached.playlists.filter(p => p.id !== playlistId),
            timestamp: Date.now()
          };
          playlistCache.set(user.uid, updatedCache);
          await saveCacheToStorage(user.uid, updatedCache);
        }
      }
    } catch (err) {
      console.error('Error deleting playlist:', err);
      throw err;
    }
  }, [user?.uid]);

  // Initialize playlists immediately when user changes
  useEffect(() => {
    if (user?.uid && !isInitialized.current) {
      console.log('🚀 Initializing playlists for user:', user.uid);
      isInitialized.current = true;
      lastUserId.current = user.uid;
      
      // Check cache first and set immediately if available
      const cached = playlistCache.get(user.uid);
      if (cached) {
        console.log('📦 Setting cached playlists immediately:', cached.playlists.length);
        setPlaylists(cached.playlists);
        setLoading(false);
        setError(null);
      }
      
      // Then load fresh data in background
      loadPlaylists();
    } else if (!user?.uid && isInitialized.current) {
      console.log('👋 User logged out, clearing state');
      isInitialized.current = false;
      lastUserId.current = null;
      setPlaylists([]);
      setLoading(false);
      setError(null);
    }
  }, [user?.uid, loadPlaylists]);

  return {
    playlists,
    loading,
    error,
    loadPlaylists,
    savePlaylist,
    removePlaylist,
  };
}; 