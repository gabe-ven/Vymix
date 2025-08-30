import { spotifyService } from './spotify';
import { PlaylistData } from './types/playlistTypes';
import { isFirebaseStorageUrl, uploadImageFromUrlToStorage } from './storageService';
import { playlistGenerationService } from './playlistGenerationService';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class PlaylistManagementService {
  async saveToSpotify(playlistData: PlaylistData, userId?: string): Promise<PlaylistData> {
    console.log('playlistManagementService.saveToSpotify called');
    console.log('Checking Spotify authentication...');
    
    if (!(await this.checkSpotifyAuth())) {
      console.log('Spotify not authenticated, throwing error');
      throw new Error('Please connect to Spotify first');
    }
    
    console.log('Spotify authenticated, proceeding with save');
    console.log('Playlist data:', { name: playlistData.name, trackCount: playlistData.tracks.length });

    const trackUris = playlistData.tracks.map(track => track.uri);
    console.log('Track URIs prepared, count:', trackUris.length);
    
    // Get user's privacy preference
    let isPublic = true; // Default to public
    if (userId) {
      try {
        const privacySetting = await AsyncStorage.getItem(`playlist_privacy_${userId}`);
        isPublic = privacySetting !== 'false'; // Default to public if not set
        console.log('Using privacy setting:', isPublic ? 'public' : 'private');
      } catch (error) {
        console.warn('Failed to load privacy setting, using default (public):', error);
      }
    }
    
    console.log('Creating playlist with tracks...');
    const spotifyPlaylist = await spotifyService.createPlaylistWithTracks(
      playlistData.name,
      playlistData.description,
      trackUris,
      isPublic
    );
    console.log('Playlist created successfully:', spotifyPlaylist.id);

    // Upload cover image if available
    if (playlistData.coverImageUrl) {
      console.log('Uploading cover image to Spotify playlist...');
      try {
        await spotifyService.uploadPlaylistCoverImage(spotifyPlaylist.id, playlistData.coverImageUrl);
        console.log('Cover image uploaded successfully');
      } catch (error) {
        console.warn('Failed to upload cover image, but playlist was created successfully:', error);
      }
    } else {
      console.log('No cover image available to upload');
    }

    const result = {
      ...playlistData,
      id: spotifyPlaylist.id,
      spotifyUrl: spotifyPlaylist.external_urls.spotify,
      isSpotifyPlaylist: true,
    };
    
    console.log('saveToSpotify completed successfully, returning result');
    return result;
  }

  private async checkSpotifyAuth(): Promise<boolean> {
    try {
      const isAuth = await spotifyService.isAuthenticated();
      if (!isAuth) {
        console.error('Spotify authentication check failed');
        return false;
      }
      
      try {
        await spotifyService.search('test', ['track'], 1, 0);
        return true;
      } catch (error) {
        console.error('Spotify token validation failed:', error);
        return false;
      }
    } catch (error) {
      console.error('Spotify authentication check error:', error);
      return false;
    }
  }
}

export const savePlaylistToFirestore = async (playlistData: Omit<PlaylistData, 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }, userId: string): Promise<string> => {
  try {
    console.log('🔥 Saving playlist to Firestore:', { 
      userId, 
      playlistName: playlistData.name,
      hasExistingId: !!playlistData.id,
      existingId: playlistData.id || 'none'
    });
    
    // Check for duplicate playlists with the same name and content
    const existingPlaylists = await getUserPlaylists(userId);
    const isDuplicate = existingPlaylists.some(existing => {
      // Only consider it a duplicate if it has the EXACT same ID
      if (playlistData.id && existing.id === playlistData.id) {
        console.log('🆔 Found playlist with same ID, this is a true duplicate');
        return true;
      }
      
      // For playlists without IDs, check content similarity (but be more lenient)
      const contentSimilar = existing.name === playlistData.name &&
                           existing.emojis.length === playlistData.emojis.length &&
                           existing.emojis.every(emoji => existing.emojis.includes(emoji)) &&
                           existing.vibe === playlistData.vibe &&
                           existing.songCount === playlistData.songCount;
      
      if (contentSimilar) {
        console.log('⚠️ Found content-similar playlist, but IDs are different - not a true duplicate');
        console.log('⚠️ Existing ID:', existing.id, 'New ID:', playlistData.id);
      }
      
      return false; // Don't treat as duplicate unless exact ID match
    });
    
    if (isDuplicate) {
      console.log('🆔 True duplicate detected (same ID), returning existing ID:', playlistData.id);
      if (playlistData.id) {
        return playlistData.id; // Return the original ID, not the Firestore ID
      }
      // Fallback to generating new ID if somehow we don't have one
      console.log('⚠️ No ID found in duplicate, this should not happen');
    }
    
    // Ensure cover image is persisted to storage if present and not already a storage URL
    let persistedCoverUrl = playlistData.coverImageUrl;
    try {
      if (playlistData.coverImageUrl && !isFirebaseStorageUrl(playlistData.coverImageUrl)) {
        const imgPath = `covers/users/${userId}/${playlistData.id || 'temp'}.jpg`;
        persistedCoverUrl = await uploadImageFromUrlToStorage(imgPath, playlistData.coverImageUrl);
      }
    } catch (e) {
      console.warn('Failed to persist cover image before saving to Firestore:', e);
    }

    const playlistToSave = {
      ...playlistData,
      coverImageUrl: persistedCoverUrl,
      userId,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    console.log('🔥 Playlist data to save:', {
      name: playlistToSave.name,
      songCount: playlistToSave.songCount,
      hasCoverImage: !!playlistToSave.coverImageUrl,
      coverImageUrl: playlistToSave.coverImageUrl ? 'Firebase Storage URL' : 'None'
    });
    
    // Check if playlistData has an existing ID (from generation service)
    if (playlistData.id) {
      console.log('🔥 Using existing ID from generation service:', playlistData.id);
      // Use the existing ID by creating a document with that specific ID
      await firestore()
        .collection('playlists')
        .doc(playlistData.id)
        .set(playlistToSave);
      
      console.log('✅ Playlist saved successfully with existing ID:', playlistData.id);
      return playlistData.id;
    } else {
      // Generate new Firestore ID as before
      const docRef = await firestore()
        .collection('playlists')
        .add(playlistToSave);
      
      console.log('✅ Playlist saved successfully with new Firestore ID:', docRef.id);
      return docRef.id;
    }
  } catch (error) {
    console.error('❌ Error saving playlist to Firestore:', error);
    console.error('❌ Error details:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      stack: (error as any)?.stack
    });
    throw error;
  }
};

/**
 * Backfill covers for existing user playlists that have non-persistent URLs.
 */
export const backfillPlaylistCovers = async (userId: string): Promise<void> => {
  try {
    const playlists = await getUserPlaylists(userId);
    const tasks: Array<Promise<void>> = [];
    for (const p of playlists) {
      if (p.coverImageUrl && !isFirebaseStorageUrl(p.coverImageUrl)) {
        const task = (async () => {
          try {
            const imgPath = `covers/users/${userId}/${p.id}.jpg`;
            const storedUrl = await uploadImageFromUrlToStorage(imgPath, p.coverImageUrl!);
            await firestore().collection('playlists').doc(p.id).update({
              coverImageUrl: storedUrl,
              updatedAt: firestore.FieldValue.serverTimestamp(),
            });
          } catch (e) {
            // If the original URL can't be fetched anymore, skip without regenerating
          }
        })();
        tasks.push(task);
      }
    }
    await Promise.allSettled(tasks);
  } catch (e) {
    // best-effort backfill
  }
};

export const getUserPlaylists = async (userId: string): Promise<PlaylistData[]> => {
  try {
    console.log('🔍 Fetching playlists for user:', userId);
    console.log('🔍 Using collection: playlists');
    
    const querySnapshot = await firestore()
      .collection('playlists')
      .where('userId', '==', userId)
      .get();

    console.log('🔍 Query completed, found', querySnapshot.size, 'documents');
    
    const playlists: PlaylistData[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      console.log('🔍 Document data:', { id: docSnapshot.id, name: data.name, userId: data.userId });
      playlists.push({
        id: docSnapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as PlaylistData);
    });

    // Sort in memory (newest first)
    playlists.sort((a, b) => {
      const dateA = a.createdAt || new Date(0);
      const dateB = b.createdAt || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    console.log('🔍 Returning', playlists.length, 'playlists');
    return playlists;
  } catch (error) {
    console.error('❌ Error fetching user playlists:', error);
    console.error('❌ Error details:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      stack: (error as any)?.stack
    });
    throw error;
  }
};

export const deletePlaylist = async (playlistId: string): Promise<void> => {
  try {
    console.log('🗑️ Attempting to delete playlist:', playlistId);
    
    const docRef = firestore().collection('playlists').doc(playlistId);
    const docSnapshot = await docRef.get();
    
    if (!docSnapshot.exists) {
      console.log('⚠️ Playlist does not exist:', playlistId);
      return;
    }
    
    console.log('🗑️ Found playlist to delete:', {
      id: playlistId,
      name: docSnapshot.data()?.name,
      userId: docSnapshot.data()?.userId
    });
    
    await docRef.delete();
    console.log('✅ Successfully deleted playlist:', playlistId);
    
  } catch (error) {
    console.error('❌ Error deleting playlist:', playlistId, error);
    console.error('❌ Error details:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      stack: (error as any)?.stack
    });
    throw error;
  }
};

export const forceDeletePlaylist = async (playlistId: string): Promise<void> => {
  try {
    console.log('🗑️ FORCE deleting playlist:', playlistId);
    
    const docRef = firestore().collection('playlists').doc(playlistId);
    await docRef.delete();
    console.log('✅ FORCE deleted playlist:', playlistId);
    
  } catch (error) {
    console.error('❌ FORCE delete failed:', playlistId, error);
    throw error;
  }
};

export const testFirestoreConnection = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing Firestore connection...');
    
    await firestore().collection('test').add({
      test: true,
      timestamp: new Date()
    });
    
    console.log('✅ Firestore connection successful');
    return true;
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
    return false;
  }
};

export const playlistManagementService = new PlaylistManagementService(); 