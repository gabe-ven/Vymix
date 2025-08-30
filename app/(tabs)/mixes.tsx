import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { Layout } from '@/app/components/Layout';
import MixCard from '@/app/components/MixCard';
import PlaylistModal from '@/app/components/PlaylistModal';
import { useSavedPlaylists } from '@/app/hooks/useSavedPlaylists';
import { LoadingAnimation } from '@/app/components/LoadingAnimation';
import AnimatedButton from '@/app/components/AnimatedButton';
import { testFirestoreConnection } from '@/services/playlistService';
import { PlaylistData } from '@/services/playlistService';
import { forceDeletePlaylist } from '@/services/playlistService';
import { useFocusEffect } from '@react-navigation/native';

export default function MixesScreen() {
  const { playlists, loading, error, loadPlaylists, removePlaylist } = useSavedPlaylists();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🎵 MixesScreen render:', { 
      playlistsCount: playlists.length, 
      loading, 
      error: error ? 'yes' : 'no' 
    });
  }, [playlists.length, loading, error]);

  // Refresh playlists when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🎵 MixesScreen focused, refreshing playlists...');
      loadPlaylists(true); // Force refresh when screen is focused
    }, [loadPlaylists])
  );

  const onRefresh = async () => {
    console.log('🔄 Pull to refresh triggered');
    setRefreshing(true);
    await loadPlaylists(true); // Force refresh
    setRefreshing(false);
  };

  const handleForceDelete = async () => {
    try {
      console.log('🗑️ Force deleting stuck playlist...');
      await forceDeletePlaylist('0iEhUOutlZbMQvp5sq4t');
      await loadPlaylists(true); // Force refresh after deletion
      console.log('✅ Force delete completed');
    } catch (error) {
      console.error('❌ Force delete failed:', error);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    Alert.alert(
      'Delete Playlist',
      'Are you sure you want to delete this playlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removePlaylist(playlistId);
              // Close modal if the deleted playlist was selected
              if (selectedPlaylist?.id === playlistId) {
                setModalVisible(false);
                setSelectedPlaylist(null);
              }
            } catch (error) {
              console.error('Error deleting playlist:', error);
              Alert.alert('Error', 'Failed to delete playlist');
            }
          },
        },
      ]
    );
  };

  const handlePlaylistPress = (playlist: PlaylistData) => {
    console.log('🎵 Playlist pressed:', playlist.name);
    setSelectedPlaylist(playlist);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedPlaylist(null);
  };

  const handleSaveToSpotify = async () => {
    if (selectedPlaylist) {
      console.log('💾 Saving playlist to Spotify:', selectedPlaylist.name);
      // TODO: Implement actual Spotify save functionality
      // For now, just show a placeholder
      Alert.alert(
        'Save to Spotify',
        'This feature will be implemented soon!',
        [{ text: 'OK' }]
      );
    }
  };

  // Show error state if there's an error
  if (error) {
    console.log('❌ Showing error state:', error);
    return (
      <Layout>
        <View className="flex-1 px-4 pt-12">
          <View className="flex-1 items-center justify-center">
            <Text className="text-xl font-poppins-bold text-white text-center mb-4">
              Setup Required
            </Text>
            <Text className="text-gray-400 text-center font-poppins mb-8 px-4">
              {error}
            </Text>
            <View className="flex-row gap-3">
              <AnimatedButton
                title="Try Again"
                onPress={() => loadPlaylists(true)}
                shouldAnimate={true}
              />
              <AnimatedButton
                title="Test Connection"
                onPress={async () => {
                  const result = await testFirestoreConnection();
                  console.log('Test result:', result);
                }}
                shouldAnimate={true}
              />
              <AnimatedButton
                title="Force Delete Stuck"
                onPress={handleForceDelete}
                shouldAnimate={true}
              />
            </View>
          </View>
        </View>
      </Layout>
    );
  }

  // Show loading only if we have no playlists and are loading
  if (loading && playlists.length === 0) {
    console.log('⏳ Showing loading animation - no cached playlists');
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <LoadingAnimation 
          message="Loading your mixes..." 
          size="large"
          mood="chill"
        />
      </View>
    );
  }

  console.log('🎵 Rendering mixes screen with', playlists.length, 'playlists');

  return (
    <Layout>
      <ScrollView 
        className="flex-1 px-4 pt-16"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ffffff"
            colors={['#ffffff']}
          />
        }
      >
        {playlists.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-xl font-poppins-bold text-white text-center mb-2">
              No mixes yet
            </Text>
            <Text className="text-gray-400 text-center font-poppins">
              Create your first playlist to see it here
            </Text>
          </View>
        ) : (
          <>
            {/* Show subtle loading indicator if loading in background */}
            {loading && (
              <View className="mb-4 px-4 py-2 bg-white bg-opacity-10 rounded-lg">
                <Text className="text-white text-sm font-poppins text-center opacity-70">
                  Refreshing playlists...
                </Text>
              </View>
            )}
            
            {playlists.map((playlist, index) => (
              <MixCard
                key={playlist.id}
                playlist={playlist}
                onPress={() => handlePlaylistPress(playlist)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Playlist Modal */}
      <PlaylistModal
        visible={modalVisible}
        playlist={selectedPlaylist}
        onClose={handleCloseModal}
        onDelete={selectedPlaylist?.id ? () => handleDeletePlaylist(selectedPlaylist.id!) : undefined}
        onSave={handleSaveToSpotify}
      />
    </Layout>
  );
} 