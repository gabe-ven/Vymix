import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Layout } from '@/app/components/Layout';
import MixCard from '@/app/components/MixCard';
import PlaylistModal from '@/app/components/PlaylistModal';
import { useSavedPlaylists } from '@/app/hooks/useSavedPlaylists';
import { LoadingAnimation } from '@/app/components/LoadingAnimation';
import AnimatedButton from '@/app/components/AnimatedButton';
import {
  testFirestoreConnection,
  playlistService,
} from '@/services/playlistService';
import { PlaylistData } from '@/services/playlistService';
import { forceDeletePlaylist } from '@/services/playlistService';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/app/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import Glass from '@/app/components/Glass';
import { useAuth } from '@/app/context/AuthContext';

export default function MixesScreen() {
  const { playlists, loading, error, loadPlaylists, removePlaylist } =
    useSavedPlaylists();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistData | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const scrollY = useSharedValue(0);

  useEffect(() => {
    // Animate header on mount
    headerOpacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
    headerTranslateY.value = withTiming(0, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const scrollAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.8],
      Extrapolate.CLAMP
    );

    return {
      opacity,
    };
  });

  // Debug logging
  useEffect(() => {
    console.log('🎵 MixesScreen render:', {
      playlistsCount: playlists.length,
      loading,
      error: error ? 'yes' : 'no',
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
      console.log('Force deleting stuck playlist...');
      await forceDeletePlaylist('0iEhUOutlZbMQvp5sq4t');
      await loadPlaylists(true); // Force refresh after deletion
      console.log('Force delete completed');
    } catch (error) {
      console.error('Force delete failed:', error);
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
    if (!selectedPlaylist) return;

    if (!user?.uid) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to save playlists to Spotify',
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('Saving playlist to Spotify:', selectedPlaylist.name);

    try {
      const updatedPlaylist = await playlistService.saveToSpotify(
        selectedPlaylist,
        user.uid
      );

      // Update the selected playlist with the Spotify URL
      setSelectedPlaylist(updatedPlaylist);

      // Refresh the playlists list to show the updated data
      await loadPlaylists(true);

      Alert.alert('Success!', 'Playlist saved to Spotify successfully!', [
        { text: 'OK' },
      ]);
    } catch (error) {
      console.error('Error saving to Spotify:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save to Spotify';

      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    }
  };

  // Show error state if there's an error
  if (error) {
    console.log('Showing error state:', error);
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
      {/* Simple Header */}
      <Animated.View
        className="px-6 pt-16 pb-4"
        style={[headerAnimatedStyle, scrollAnimatedStyle]}
      >
        <Text className="text-3xl font-poppins-bold text-white mb-4 text-center">
          Your Mixes
        </Text>
      </Animated.View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          scrollY.value = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary.lime}
            colors={[COLORS.primary.lime]}
            progressBackgroundColor="rgba(255, 255, 255, 0.1)"
          />
        }
      >
        {playlists.length === 0 ? (
          <View
            style={{ minHeight: 500 }}
            className="items-center justify-center px-6"
          >
            <View className="items-center">
              <Text className="text-2xl font-poppins-bold text-white text-center mb-3">
                No mixes yet
              </Text>
              <Text className="text-white/60 text-center font-poppins text-base leading-relaxed">
                Create your first playlist to see it here
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* Show enhanced loading indicator if loading in background */}
            {loading && (
              <View className="mb-4">
                <Glass
                  className="px-4 py-3"
                  blurAmount={15}
                  borderRadius={16}
                  backgroundColor="rgba(182, 245, 0, 0.1)"
                >
                  <View className="flex-row items-center justify-center">
                    <Ionicons
                      name="refresh"
                      size={16}
                      color={COLORS.primary.lime}
                      style={{ marginRight: 8 }}
                    />
                    <Text className="text-lime-400 text-sm font-poppins-bold">
                      Refreshing playlists...
                    </Text>
                  </View>
                </Glass>
              </View>
            )}

            {/* Enhanced playlist grid */}
            <View className="pb-8">
              {playlists.map((playlist, index) => (
                <View key={playlist.id}>
                  <MixCard
                    playlist={playlist}
                    onPress={() => handlePlaylistPress(playlist)}
                  />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Enhanced Playlist Modal */}
      <PlaylistModal
        visible={modalVisible}
        playlist={selectedPlaylist}
        onClose={handleCloseModal}
        onDelete={
          selectedPlaylist?.id
            ? () => handleDeletePlaylist(selectedPlaylist.id!)
            : undefined
        }
        onSave={selectedPlaylist?.spotifyUrl ? undefined : handleSaveToSpotify}
      />
    </Layout>
  );
}
