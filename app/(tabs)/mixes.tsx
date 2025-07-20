import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { Layout } from '@/app/components/Layout';
import MixCard from '@/app/components/MixCard';
import { useSavedPlaylists } from '@/app/hooks/useSavedPlaylists';
import { LoadingAnimation } from '@/app/components/LoadingAnimation';
import AnimatedButton from '@/app/components/AnimatedButton';
import { testFirestoreConnection } from '@/services/playlistService';

export default function MixesScreen() {
  const { playlists, loading, error, loadPlaylists, removePlaylist } = useSavedPlaylists();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlaylists();
    setRefreshing(false);
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
            } catch (error) {
              console.error('Error deleting playlist:', error);
              Alert.alert('Error', 'Failed to delete playlist');
            }
          },
        },
      ]
    );
  };

  if (loading) {
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

  if (error) {
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
                onPress={loadPlaylists}
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
            </View>
          </View>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <ScrollView 
        className="flex-1 px-4 pt-12"
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
          playlists.map((playlist) => (
            <MixCard
              key={playlist.id}
              playlist={playlist}
              onDelete={() => playlist.id && handleDeletePlaylist(playlist.id)}
            />
          ))
        )}
      </ScrollView>
    </Layout>
  );
} 