import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserPlaylists, savePlaylistToFirestore, deletePlaylist, PlaylistData } from '../../services/playlistService';
import { backfillPlaylistCovers } from '../../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playlistService } from '../../services/playlistService';

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
      
      // Validate cache by checking if playlists still exist in Firestore
      try {
        const freshPlaylists = await getUserPlaylists(user.uid);
        const cachedIds = new Set(cached.playlists.map(p => p.id));
        const freshIds = new Set(freshPlaylists.map(p => p.id));
        
        // Check if any cached playlists no longer exist
        const missingPlaylists = cached.playlists.filter(p => !freshIds.has(p.id));
        if (missingPlaylists.length > 0) {
          console.log('⚠️ Found stale cached playlists:', missingPlaylists.length);
          console.log('⚠️ Missing playlist IDs:', missingPlaylists.map(p => p.id));
          
          // Update cache with fresh data
          const updatedCache = {
            playlists: freshPlaylists,
            timestamp: Date.now()
          };
          playlistCache.set(user.uid, updatedCache);
          await saveCacheToStorage(user.uid, updatedCache);
          setPlaylists(freshPlaylists);
          console.log('✅ Updated cache with fresh data:', freshPlaylists.length);
        } else {
          console.log('✅ Cache validation passed');
        }
      } catch (validationError) {
        console.warn('⚠️ Cache validation failed, using fresh data:', validationError);
        // If validation fails, fetch fresh data
        const freshPlaylists = await getUserPlaylists(user.uid);
        const updatedCache = {
          playlists: freshPlaylists,
          timestamp: Date.now()
        };
        playlistCache.set(user.uid, updatedCache);
        await saveCacheToStorage(user.uid, updatedCache);
        setPlaylists(freshPlaylists);
      }
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
      // Background: backfill covers into Storage and refresh local cache once done
      (async () => {
        try {
          await backfillPlaylistCovers(user.uid);
          const refreshed = await getUserPlaylists(user.uid);
          const updatedCache = { playlists: refreshed, timestamp: Date.now() };
          playlistCache.set(user.uid, updatedCache);
          await saveCacheToStorage(user.uid, updatedCache);
          setPlaylists(refreshed);
        } catch {}
      })();
      
      // Cache the results
      const cacheData = {
        playlists: userPlaylists,
        timestamp: Date.now()
      };
      playlistCache.set(user.uid, cacheData);
      await saveCacheToStorage(user.uid, cacheData);
      
      setPlaylists(userPlaylists);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('❌ Error loading playlists:', err);
      setError(err instanceof Error ? err.message : 'Failed to load playlists');
      setLoading(false);
      
      // If fresh fetch fails, try to use expired cache as fallback
      if (cached) {
        console.log('🔄 Using expired cache as fallback');
        setPlaylists(cached.playlists);
      }
    }
  }, [user?.uid]);

  const savePlaylist = useCallback(async (playlistData: Omit<PlaylistData, 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    console.log('💾 savePlaylist called with:', {
      playlistName: playlistData.name,
      hasId: !!playlistData.id,
      playlistId: playlistData.id || 'none'
    });

    try {
      const playlistId = await savePlaylistToFirestore(playlistData, user.uid);
      
      console.log('💾 savePlaylistToFirestore returned ID:', playlistId);
      console.log('💾 Original playlistData ID:', playlistData.id);
      console.log('💾 ID match:', playlistId === playlistData.id ? '✅ YES' : '❌ NO');
      
      // Add the new playlist to the local state
      const newPlaylist: PlaylistData = {
        ...playlistData,
        id: playlistId,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setPlaylists(prev => {
        // Check if playlist with this ID already exists
        const existingIndex = prev.findIndex(p => p.id === playlistId);
        if (existingIndex !== -1) {
          console.log('⚠️ Playlist already exists in state, updating instead of adding:', playlistId);
          // Update existing playlist
          const updated = [...prev];
          updated[existingIndex] = newPlaylist;
          return updated;
        }
        
        // Every playlist is unique - just add it
        
        // Add new playlist
        console.log('✅ Adding new playlist to state:', playlistId);
        return [newPlaylist, ...prev];
      });
      
      // Update cache
      const cached = playlistCache.get(user.uid);
      if (cached) {
        const existingIndex = cached.playlists.findIndex(p => p.id === playlistId);
        let updatedPlaylists;
        
        if (existingIndex !== -1) {
          console.log('⚠️ Playlist already exists in cache, updating instead of adding:', playlistId);
          // Update existing playlist in cache
          updatedPlaylists = [...cached.playlists];
          updatedPlaylists[existingIndex] = newPlaylist;
        } else {
          // Check for content similarity in cache
          const contentSimilarIndex = cached.playlists.findIndex(p => 
            p.name === newPlaylist.name &&
            p.emojis.length === newPlaylist.emojis.length &&
            p.emojis.every(emoji => newPlaylist.emojis.includes(emoji)) &&
            p.vibe === newPlaylist.vibe &&
            p.songCount === newPlaylist.songCount
          );
          
          if (contentSimilarIndex !== -1) {
            console.log('⚠️ Content-similar playlist found in cache, updating instead of adding:', {
              existingId: cached.playlists[contentSimilarIndex].id,
              newId: playlistId
            });
            // Update existing playlist in cache
            updatedPlaylists = [...cached.playlists];
            updatedPlaylists[contentSimilarIndex] = newPlaylist;
          } else {
            // Add new playlist to cache
            console.log('✅ Adding new playlist to cache:', playlistId);
            updatedPlaylists = [newPlaylist, ...cached.playlists];
          }
        }
        
        const updatedCache = {
          playlists: updatedPlaylists,
          timestamp: Date.now()
        };
        playlistCache.set(user.uid, updatedCache);
        await saveCacheToStorage(user.uid, updatedCache);
      }
      
      // AUTO-SAVE TO SPOTIFY - SIMPLE AND CLEAN!
      try {
        const autoSaveSetting = await AsyncStorage.getItem(`auto_save_spotify_${user.uid}`);
        if (autoSaveSetting === 'true') {
          console.log('🎵 Auto-saving to Spotify...');
          await playlistService.saveToSpotify(newPlaylist, user.uid);
          console.log('✅ Auto-saved to Spotify successfully!');
        }
      } catch (spotifyError) {
        console.log('⚠️ Auto-save to Spotify failed (playlist still saved locally):', spotifyError);
        // Don't throw - playlist is still saved locally
      }
      
      return playlistId;
    } catch (err) {
      console.error('Error saving playlist:', err);
      throw err;
    }
  }, [user?.uid]);

  const removePlaylist = useCallback(async (playlistId: string) => {
    try {
      console.log('🗑️ Removing playlist:', playlistId);
      await deletePlaylist(playlistId);
      
      // Update local state
      setPlaylists(prev => {
        const filtered = prev.filter(p => p.id !== playlistId);
        console.log('🗑️ Updated local state:', { before: prev.length, after: filtered.length });
        return filtered;
      });
      
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
          console.log('🗑️ Updated cache:', { before: cached.playlists.length, after: updatedCache.playlists.length });
        }
      }
    } catch (err) {
      console.error('Error deleting playlist:', err);
      throw err;
    }
  }, [user?.uid]);

  const clearCache = useCallback(async () => {
    if (!user?.uid) return;
    
    console.log('🧹 Clearing cache for user:', user.uid);
    playlistCache.delete(user.uid);
    await AsyncStorage.removeItem(CACHE_KEY_PREFIX + user.uid);
    setPlaylists([]);
    console.log('🧹 Cache cleared');
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
    clearCache,
  };
}; 