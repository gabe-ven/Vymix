import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { Layout } from '@/app/components/Layout';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LoadingAnimation } from '../../components/LoadingAnimation';
import PlaylistCard from '../../components/PlaylistCard';
import SongList from '../../components/SongList';
import GradientBackground from '../../components/GradientBackground';
import { COLORS } from '../../constants/colors';
import { ANIMATION } from '../../constants/animations';
import { useFadeSlideIn } from '../../hooks/useFadeSlideIn';
import { usePlaylist } from '../../hooks/usePlaylist';
import Glass from '../../components/Glass';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedScrollHandler,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

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
  
  // Reanimated shared values
  const scrollY = useSharedValue(0);

  // Animation values for the pop-up effect
  const playlistCardScale = useSharedValue(0);
  const playlistCardOpacity = useSharedValue(0);
  const songListOpacity = useSharedValue(0);
  const actionButtonsOpacity = useSharedValue(0);

  // Load playlist data on mount
  useEffect(() => {
    loadPlaylist();
  }, []);

  // Trigger animations when playlist data is loaded
  useEffect(() => {
    if (playlistData && !loading) {
      animatePlaylistCard();
    }
  }, [playlistData, loading]);

  const animatePlaylistCard = () => {
    // Reset animation values
    playlistCardScale.value = 0;
    playlistCardOpacity.value = 0;
    songListOpacity.value = 0;
    actionButtonsOpacity.value = 0;

    // Smooth sequential fade-up animations using constants
    playlistCardOpacity.value = withTiming(1, { 
      duration: ANIMATION.DURATION.NORMAL,
    });
    playlistCardScale.value = withTiming(1, { 
      duration: ANIMATION.DURATION.NORMAL,
    });
    
    // Buttons fade up after playlist card with shorter delay
    actionButtonsOpacity.value = withDelay(ANIMATION.DELAY.BUTTONS, withTiming(1, { 
      duration: ANIMATION.DURATION.NORMAL,
    }));
    
    // Song list fade up after buttons with shorter delay
    songListOpacity.value = withDelay(ANIMATION.DELAY.LIST, withTiming(1, { 
      duration: ANIMATION.DURATION.NORMAL,
    }));
  };

  // Create gradient colors from playlist color palette
  const getGradientColors = () => {
    if (!playlistData?.colorPalette || playlistData.colorPalette.length === 0) {
      return [COLORS.primary.darkPurple, COLORS.primary.lime, COLORS.ui.black];
    }
    return playlistData.colorPalette;
  };

  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Custom animated style for playlist card with 3D effects
  const playlistCardAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      ANIMATION.SCROLL.FADE_RANGE,
      [playlistCardScale.value, playlistCardScale.value * ANIMATION.TRANSFORM.SCALE_DOWN],
      Extrapolate.CLAMP
    );
    
    const translateY = interpolate(
      scrollY.value,
      ANIMATION.SCROLL.FADE_RANGE,
      [0, -40],
      Extrapolate.CLAMP
    );

    const rotateX = interpolate(
      scrollY.value,
      ANIMATION.SCROLL.FADE_RANGE,
      [0, ANIMATION.TRANSFORM.ROTATE_X * 0.5],
      Extrapolate.CLAMP
    );

    const shadowOpacity = interpolate(
      scrollY.value,
      ANIMATION.SCROLL.FADE_RANGE,
      [ANIMATION.SHADOW.OPACITY.START, ANIMATION.SHADOW.OPACITY.END],
      Extrapolate.CLAMP
    );

    const shadowRadius = interpolate(
      scrollY.value,
      ANIMATION.SCROLL.FADE_RANGE,
      [ANIMATION.SHADOW.RADIUS.START, ANIMATION.SHADOW.RADIUS.END],
      Extrapolate.CLAMP
    );

    const fadeOpacity = interpolate(
      scrollY.value,
      [100, 400],
      [1, 0.3],
      Extrapolate.CLAMP
    );

    return {
      opacity: playlistCardOpacity.value * fadeOpacity,
      transform: [
        { translateY },
        { scale },
        { rotateX: `${rotateX}deg` },
        { perspective: ANIMATION.TRANSFORM.PERSPECTIVE },
      ],
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity,
      shadowRadius,
      elevation: interpolate(
        scrollY.value,
        ANIMATION.SCROLL.FADE_RANGE,
        [ANIMATION.SHADOW.ELEVATION.START, ANIMATION.SHADOW.ELEVATION.END],
        Extrapolate.CLAMP
      ),
    };
  });

  // Use the hook for buttons and song list animations
  const buttonsAnimatedStyle = useFadeSlideIn(actionButtonsOpacity, {
    startTranslateY: ANIMATION.TRANSFORM.START_TRANSLATE_Y,
    scrollY: scrollY,
    scrollFadeRange: ANIMATION.SCROLL.BUTTONS_FADE_RANGE
  });

  // Floating title animation
  const floatingTitleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      ANIMATION.SCROLL.FLOATING_TITLE_RANGE,
      [0, 1],
      Extrapolate.CLAMP
    );
    
    const translateY = interpolate(
      scrollY.value,
      ANIMATION.SCROLL.FLOATING_TITLE_RANGE,
      [20, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }]
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
        console.error('Error opening Spotify:', error);
        Alert.alert(
          'Error',
          'Failed to open playlist in Spotify.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleSaveToSpotify = async () => {
    try {
      await saveToSpotify();
      Alert.alert(
        'Saved to Spotify! 🎉',
        'Your playlist has been created and saved to Spotify!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save to Spotify';
      Alert.alert(
        'Save Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    }
  };

  if (loading) {
    return (
      <Layout>
        <View className="flex-1 justify-center items-center pt-20">
          <LoadingAnimation 
            message={playlistData ? "Regenerating your playlist..." : "Generating your perfect playlist..."}
            size="large"
          />
        </View>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <View className="flex-1 justify-center items-center pt-20 px-4">
          <Ionicons name="alert-circle" size={64} color={COLORS.primary.orange} />
          <Text className="text-ui-white text-xl font-bold mt-4 mb-2 font-poppins-bold text-center">
            Oops! Something went wrong
          </Text>
          <Text className="text-ui-white text-base text-center mb-6 font-poppins">
            {error}
          </Text>
          <Glass 
            className="rounded-full shadow-lg"
            blurAmount={20}
            backgroundColor={COLORS.transparent.white[10]}
          >
            <TouchableOpacity
              onPress={handleRetry}
              className="rounded-full px-6 py-3 items-center justify-center"
            >
              <Text className="text-ui-white font-semibold text-lg font-poppins-bold">
                Try Again
              </Text>
            </TouchableOpacity>
          </Glass>
        </View>
      </Layout>
    );
  }

  return (
    <GradientBackground colors={getGradientColors()} scrollY={scrollY}>
      <Animated.ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 60, paddingBottom: 200 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Animated Playlist Header */}
        <Animated.View style={playlistCardAnimatedStyle}>
          <View className="px-4 -mb-10">
            <PlaylistCard
              name={playlistData?.name || 'My Playlist'}
              description={playlistData?.description || 'A great mix of songs'}
              songCount={playlistData?.songCount || 10}
              isSelected={true}
              coverImageUrl={playlistData?.coverImageUrl}
            />
          </View>
        </Animated.View>

        {/* Action Buttons - Between playlist card and song list */}
        <Animated.View style={[buttonsAnimatedStyle, { zIndex: 5 }]}>
          <View className="px-4 mb-16 mt-4">
            <View className="flex-row justify-center flex-wrap">
              {playlistData?.isSpotifyPlaylist ? (
                // Playlist is already saved to Spotify
                <Glass 
                  className="rounded-full mr-4 mb-2 shadow-lg"
                  blurAmount={20}
                  backgroundColor={COLORS.transparent.white[10]}
                >
                  <TouchableOpacity
                    onPress={handleOpenInSpotify}
                    className="rounded-full px-6 py-3 items-center justify-center"
                  >
                    <Text className="text-ui-white font-bold text-base font-poppins-bold">
                      Open in the app
                    </Text>
                  </TouchableOpacity>
                </Glass>
              ) : (
                // Playlist is not saved to Spotify yet
                <Glass 
                  className="rounded-full mr-4 mb-2 shadow-lg"
                  blurAmount={20}
                  backgroundColor={COLORS.transparent.white[10]}
                >
                  <TouchableOpacity
                    onPress={handleSaveToSpotify}
                    className="rounded-full px-6 py-3 items-center justify-center"
                  >
                    <Text className="text-ui-white font-bold text-base font-poppins-bold">
                      Save
                    </Text>
                  </TouchableOpacity>
                </Glass>
              )}

              <Glass 
                className="rounded-full mr-4 mb-2 shadow-lg"
                blurAmount={20}
                backgroundColor={COLORS.transparent.white[10]}
              >
                <TouchableOpacity
                  onPress={regeneratePlaylist}
                  className="rounded-full px-6 py-3 items-center justify-center"
                >
                  <Text className="text-ui-white font-semibold text-base font-poppins-bold">
                    Regenerate
                  </Text>
                </TouchableOpacity>
              </Glass>

              <Glass 
                className="rounded-full mb-2 shadow-lg"
                blurAmount={20}
                backgroundColor={COLORS.transparent.white[10]}
              >
                <TouchableOpacity
                  onPress={handleRetry}
                  className="rounded-full px-6 py-3 items-center justify-center"
                >
                  <Text className="text-ui-white font-semibold text-base font-poppins-bold">
                    New Vibe
                  </Text>
                </TouchableOpacity>
              </Glass>
            </View>
          </View>
        </Animated.View>

        {/* Songs List with enhanced styling and animation */}
        <View className="px-4 mt-4" style={{ zIndex: 1 }}>
          <SongList 
            songs={formatTracksForDisplay()} 
            showScrollView={false}
            scrollY={scrollY}
          />
        </View>
      </Animated.ScrollView>

      {/* Floating Title that appears when scrolling - positioned absolutely */}
      <Animated.View 
        style={[
          floatingTitleAnimatedStyle,
          {
            position: 'absolute',
            top: 60,
            left: 16,
            right: 16,
            zIndex: 10,
          }
        ]}
      >
        <Glass 
          className="px-6 py-3"
          borderRadius={20}
          blurAmount={20}
          backgroundColor={COLORS.transparent.white[10]}
        >
          <Text className="text-xl font-bold text-ui-white font-poppins-bold text-center" numberOfLines={1}>
            {playlistData?.name || 'My Playlist'}
          </Text>
        </Glass>
      </Animated.View>
    </GradientBackground>
  );
};

export default Playlist;