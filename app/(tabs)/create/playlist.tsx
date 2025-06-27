import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Layout } from '@/app/components/Layout';
import { useRouter } from 'expo-router';
import { LoadingAnimation } from '../../components/LoadingAnimation';
import PlaylistCard from '../../components/PlaylistCard';
import SongList from '../../components/SongList';
import GradientBackground from '../../components/GradientBackground';
import AnimatedButton from '../../components/AnimatedButton';
import { COLORS } from '../../constants/colors';
import { usePlaylist } from '../../hooks/usePlaylist';
import Glass from '../../components/Glass';

interface PlaylistData {
  name: string;
  description: string;
  colorPalette: string[];
  keywords: string[];
  coverImageUrl?: string;
  emojis: string[];
  songCount: number;
  vibe: string;
  tracks: any[];
  spotifyUrl?: string;
  id?: string;
  isSpotifyPlaylist?: boolean;
}

const Playlist = () => {
  const router = useRouter();
  const { playlistData, loading, error, regeneratePlaylist, saveToSpotify, loadPlaylist } = usePlaylist();
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  // Scroll animation values
  const scrollY = useSharedValue(0);
  
  // Load playlist data on mount
  useEffect(() => {
    loadPlaylist();
  }, []);

  // Enable animations when playlist data is loaded
  useEffect(() => {
    if (playlistData && !loading) {
      // Small delay to ensure everything is rendered before starting animations
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [playlistData, loading]);

  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Create gradient colors from playlist color palette
  const getGradientColors = () => {
    if (!playlistData?.colorPalette || playlistData.colorPalette.length === 0) {
      return [COLORS.primary.darkPurple, COLORS.primary.lime, COLORS.ui.black];
    }
    return playlistData.colorPalette;
  };

  // Animated gradient overlay style
  const gradientOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 300, 600],
      [0.4, 0.2, 0.1],
      Extrapolate.CLAMP
    );

    return {
      opacity,
    };
  });

  // Sticky header animation style
  const stickyHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [400, 500],
      [0, 1],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [400, 500],
      [-50, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // Convert tracks to the format expected by SongList component
  const formatTracksForDisplay = () => {
    if (!playlistData?.tracks) return [];
    
    return playlistData.tracks.map((track) => {
      // Get album image URL (prefer the smallest image for better performance)
      const albumImageUrl = track.album?.images?.[track.album.images.length - 1]?.url || undefined;
      
      return {
        title: track.name,
        artist: track.artists?.map((artist: { name: string }) => artist.name).join(', ') || 'Unknown Artist',
        album: track.album?.name || 'Unknown Album',
        duration: track.duration_ms || 0,
        spotifyUrl: track.external_urls?.spotify || '',
        albumImageUrl: albumImageUrl,
      };
    });
  };

  const handleRetry = () => {
    router.replace('/(tabs)/create');
  };

  const handleOpenInSpotify = async () => {
    if (playlistData?.spotifyUrl) {
      try {
        const supported = await Linking.canOpenURL(playlistData.spotifyUrl);
        if (supported) {
          await Linking.openURL(playlistData.spotifyUrl);
        } else {
          Alert.alert(
            'Spotify Not Available',
            'Please install Spotify to open this playlist.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        Alert.alert(
          'Error',
          'Failed to open Spotify. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleSaveToSpotify = async () => {
    try {
      await saveToSpotify();
      Alert.alert(
        'Success!',
        'Playlist saved to Spotify successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to save playlist to Spotify. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <LoadingAnimation 
          message="Creating your playlist..." 
          size="large"
          mood={playlistData?.vibe?.toLowerCase() || 'chill'}
        />
      </View>
    );
  }

  if (error) {
    return (
      <GradientBackground colors={getGradientColors()}>
        <Layout>
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-ui-white text-xl font-poppins-bold text-center mb-4">
              Oops! Something went wrong
            </Text>
            <Text className="text-ui-gray-light text-base font-poppins text-center mb-8">
              {error}
            </Text>
            <AnimatedButton
              title="Try Again"
              onPress={regeneratePlaylist}
              shouldAnimate={true}
            />
          </View>
        </Layout>
      </GradientBackground>
    );
  }

  if (!playlistData) {
    return (
      <GradientBackground colors={getGradientColors()}>
        <Layout>
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-ui-white text-xl font-poppins-bold text-center mb-4">
              No playlist data found
            </Text>
            <AnimatedButton
              title="Go Back"
              onPress={handleRetry}
              shouldAnimate={true}
            />
          </View>
        </Layout>
      </GradientBackground>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      {/* Sticky Header with Playlist Name */}
      <Animated.View 
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            paddingTop: 50,
            paddingBottom: 20,
            paddingHorizontal: 20,
          },
          stickyHeaderStyle
        ]}
      >
        <Glass 
          className="p-4"
          borderRadius={24}
          blurAmount={20}
          backgroundColor={COLORS.transparent.white[10]}
        >
          <Text className="text-lg font-bold text-ui-white font-poppins-bold text-center">
            {playlistData.name}
          </Text>
        </Glass>
      </Animated.View>

      <View className="flex-1">
        {/* AI-Generated Gradient Overlay */}
        <Animated.View 
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 600,
              zIndex: 1,
            },
            gradientOverlayStyle
          ]}
        >
          <LinearGradient
            colors={[...getGradientColors(), '#000000'] as any}
            locations={[0, 0.3, 0.7, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
          />
        </Animated.View>

        <Animated.ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          style={{ zIndex: 2 }}
        >
          {/* Playlist Card */}
          <View className="px-4 mb-6">
            <PlaylistCard
              name={playlistData.name}
              description={playlistData.description}
              songCount={playlistData.songCount}
              coverImageUrl={playlistData.coverImageUrl}
              shouldAnimate={shouldAnimate}
              scrollY={scrollY}
            />
          </View>
          {/* Action Buttons */}
          <View className="px-4 mb-6">
            <View className="flex-row justify-center flex-wrap gap-3">
              {playlistData?.isSpotifyPlaylist ? (
                // Playlist is already saved to Spotify
                <AnimatedButton
                  title="Open in the app"
                  onPress={handleOpenInSpotify}
                  shouldAnimate={shouldAnimate}
                  delay={900}
                  scrollY={scrollY}
                />
              ) : (
                // Playlist is not saved to Spotify yet
                <AnimatedButton
                  title="Save"
                  onPress={handleSaveToSpotify}
                  shouldAnimate={shouldAnimate}
                  delay={900}
                  scrollY={scrollY}
                />
              )}

              <AnimatedButton
                title="Regenerate"
                onPress={regeneratePlaylist}
                shouldAnimate={shouldAnimate}
                delay={1050}
                scrollY={scrollY}
              />

              <AnimatedButton
                title="New Vibe"
                onPress={handleRetry}
                shouldAnimate={shouldAnimate}
                delay={1200}
                scrollY={scrollY}
              />
            </View>
          </View>

          {/* Songs List */}
          <View className="px-4">
            <SongList 
              songs={formatTracksForDisplay()} 
              showScrollView={false}
              shouldAnimate={shouldAnimate}
              scrollY={scrollY}
            />
          </View>
        </Animated.ScrollView>
      </View>
    </View>
  );
};

export default Playlist; 