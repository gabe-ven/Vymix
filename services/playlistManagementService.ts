import { spotifyService } from './spotify';
import { PlaylistData } from './types/playlistTypes';
import firestore from '@react-native-firebase/firestore';

export class PlaylistManagementService {
  async saveToSpotify(playlistData: PlaylistData): Promise<PlaylistData> {
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
    
    console.log('Creating playlist with tracks...');
    const spotifyPlaylist = await spotifyService.createPlaylistWithTracks(
      playlistData.name,
      playlistData.description,
      trackUris,
      true
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

export const savePlaylistToFirestore = async (playlistData: Omit<PlaylistData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> => {
  try {
    console.log('🔥 Saving playlist to Firestore:', { userId, playlistName: playlistData.name });
    
    // Check for duplicate playlists with the same name and content
    const existingPlaylists = await getUserPlaylists(userId);
    const isDuplicate = existingPlaylists.some(existing => {
      return existing.name === playlistData.name &&
             existing.emojis.length === playlistData.emojis.length &&
             existing.emojis.every(emoji => existing.emojis.includes(emoji)) &&
             existing.vibe === playlistData.vibe &&
             existing.songCount === playlistData.songCount;
    });
    
    if (isDuplicate) {
      console.log('⚠️ Duplicate playlist detected, skipping save:', playlistData.name);
      const existingPlaylist = existingPlaylists.find(existing => 
        existing.name === playlistData.name &&
        existing.emojis.length === playlistData.emojis.length &&
        existing.emojis.every(emoji => existing.emojis.includes(emoji)) &&
        existing.vibe === playlistData.vibe &&
        existing.songCount === playlistData.songCount
      );
      return existingPlaylist?.id || '';
    }
    
    const playlistToSave = {
      ...playlistData,
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
    
    const docRef = await firestore()
      .collection('playlists')
      .add(playlistToSave);
    
    console.log('✅ Playlist saved successfully with ID:', docRef.id);
    return docRef.id;
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

    // Sort in memory (oldest first, newest at bottom)
    playlists.sort((a, b) => {
      const dateA = a.createdAt || new Date(0);
      const dateB = b.createdAt || new Date(0);
      return dateA.getTime() - dateB.getTime();
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