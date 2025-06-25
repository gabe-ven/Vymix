import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Layout } from '@/app/components/Layout';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePlaylistGeneration } from '../../hooks/usePlaylistGeneration';
import { LoadingAnimation } from '../../components/LoadingAnimation';
import PlaylistCard from '../../components/PlaylistCard';
import SongList from '../../components/SongList';
import GradientBackground from '../../components/GradientBackground';
import { COLORS } from '../../constants/colors';
import Glass from '../../components/Glass';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedScrollHandler,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

const Playlist = () => {
  const router = useRouter();
  const { playlistData, loading, error, generatePlaylist, resetPlaylist } = usePlaylistGeneration();
  
  // Reanimated shared values
  const scrollY = useSharedValue(0);
  const coverOpacity = useSharedValue(1);
  const titleOpacity = useSharedValue(1);
  const descriptionOpacity = useSharedValue(1);

  // Animation values for the pop-up effect
  const playlistCardScale = useSharedValue(0);
  const playlistCardOpacity = useSharedValue(0);
  const songListTranslateY = useSharedValue(50);
  const songListOpacity = useSharedValue(0);
  const actionButtonsTranslateY = useSharedValue(50);
  const actionButtonsOpacity = useSharedValue(0);

  // Trigger animations when playlist data is loaded
  useEffect(() => {
    if (playlistData && !loading) {
      // Start the animation sequence
      animatePlaylistCard();
    }
  }, [playlistData, loading]);

  const animatePlaylistCard = () => {
    // Reset animation values
    playlistCardScale.value = 0;
    playlistCardOpacity.value = 0;
    songListTranslateY.value = 50;
    songListOpacity.value = 0;
    actionButtonsTranslateY.value = 50;
    actionButtonsOpacity.value = 0;

    // Simple sequential fade-up animations
    playlistCardOpacity.value = withTiming(1, { duration: 600 });
    playlistCardScale.value = withTiming(1, { duration: 600 });
    
    // Buttons fade up after playlist card
    actionButtonsOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    actionButtonsTranslateY.value = withDelay(300, withTiming(0, { duration: 600 }));
    
    // Song list fade up after buttons
    songListOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    songListTranslateY.value = withDelay(600, withTiming(0, { duration: 600 }));
  };

  // Create gradient colors from playlist color palette
  const getGradientColors = () => {
    if (!playlistData?.colorPalette || playlistData.colorPalette.length === 0) {
      return [COLORS.primary.darkPurple, COLORS.primary.lime, COLORS.ui.black];
    }

    // Use the AI-generated color palette from user input
    return playlistData.colorPalette;
  };

  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      
      // Fade out cover, title, and description as user scrolls
      const fadeOutValue = Math.max(0, 1 - (event.contentOffset.y / 200));
      coverOpacity.value = fadeOutValue;
      titleOpacity.value = fadeOutValue;
      descriptionOpacity.value = fadeOutValue;
    },
  });

  // Animated styles
  const playlistCardAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, 200],
      [playlistCardScale.value, playlistCardScale.value * 0.95],
      Extrapolate.CLAMP
    );
    
    const translateY = interpolate(
      scrollY.value,
      [0, 200],
      [0, -50],
      Extrapolate.CLAMP
    );

    return {
      opacity: playlistCardOpacity.value * coverOpacity.value,
      transform: [
        { translateY },
        { scale }
      ]
    };
  });

  const buttonsAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [300, 500],
      [actionButtonsOpacity.value, 0],
      Extrapolate.CLAMP
    );
    
    const translateY = interpolate(
      scrollY.value,
      [300, 500],
      [actionButtonsTranslateY.value, actionButtonsTranslateY.value - 20],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }]
    };
  });

  const floatingTitleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [150, 250],
      [0, 1],
      Extrapolate.CLAMP
    );
    
    const translateY = interpolate(
      scrollY.value,
      [150, 250],
      [20, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }]
    };
  });

  const songListAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: songListOpacity.value,
      transform: [{ translateY: songListTranslateY.value }]
    };
  });

  // Example songs and artists for demonstration
  const exampleSongs = [
    { title: "Blinding Lights", artist: "The Weeknd" },
    { title: "Levitating", artist: "Dua Lipa" },
    { title: "Stay", artist: "Kid LAROI & Justin Bieber" },
    { title: "Good 4 U", artist: "Olivia Rodrigo" },
    { title: "Shivers", artist: "Ed Sheeran" },
    { title: "We Don't Talk About Bruno", artist: "Carolina Gaitán" },
    { title: "As It Was", artist: "Harry Styles" },
    { title: "About Damn Time", artist: "Lizzo" },
    { title: "Late Night Talking", artist: "Harry Styles" },
    { title: "Hold Me Closer", artist: "Elton John & Britney Spears" },
    { title: "Super Freaky Girl", artist: "Nicki Minaj" },
    { title: "Vampire", artist: "Olivia Rodrigo" },
    { title: "Break My Soul", artist: "Beyoncé" },
    { title: "Running Up That Hill", artist: "Kate Bush" },
    { title: "Hold Me Closer", artist: "Elton John & Britney Spears" },
    { title: "Late Night Talking", artist: "Harry Styles" },
    { title: "Hold Me Closer", artist: "Elton John & Britney Spears" },
    { title: "Super Freaky Girl", artist: "Nicki Minaj" },
    { title: "Vampire", artist: "Olivia Rodrigo" },
    { title: "Break My Soul", artist: "Beyoncé" },
    { title: "Running Up That Hill", artist: "Kate Bush" },
  ];

  const handleRetry = () => {
    resetPlaylist();
    router.replace('/(tabs)/create');
  };

  const handleRegenerate = async () => {
    // Reset current data and regenerate with same vibe/emojis
    resetPlaylist();
    try {
      await generatePlaylist();
    } catch (error) {
      console.error('Failed to regenerate playlist:', error);
    }
  };

  const handleCreatePlaylist = () => {
    // TODO: Implement actual playlist creation logic
    console.log('Creating playlist:', playlistData);
  };

  if (loading) {
    return (
      <Layout>
        <View className="flex-1 justify-center items-center pt-20">
          <LoadingAnimation 
            message="Generating your perfect playlist..."
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
          <TouchableOpacity
            onPress={handleRetry}
            className="rounded-full px-6 py-3 items-center justify-center"
            style={{ backgroundColor: COLORS.primary.darkPurple }}
          >
            <Text className="text-ui-white font-semibold text-lg font-poppins-bold">
              Try Again
            </Text>
          </TouchableOpacity>
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
          <View className="px-4 pt-4">
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
        <Animated.View style={buttonsAnimatedStyle}>
          <View className="px-4 mt-6 mb-2">
            <View className="flex-row justify-center">
              <TouchableOpacity
                onPress={handleCreatePlaylist}
                className="rounded-full px-6 py-3 items-center justify-center mr-4"
                style={{ backgroundColor: COLORS.primary.lime }}
              >
                <Text className="text-ui-black font-bold text-base font-poppins-bold">
                  Save
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRegenerate}
                className="rounded-full px-6 py-3 items-center justify-center mr-4"
                style={{ backgroundColor: COLORS.primary.orange }}
              >
                <Text className="text-ui-white font-semibold text-base font-poppins-bold">
                  Regenerate
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRetry}
                className="rounded-full px-6 py-3 items-center justify-center"
                style={{ backgroundColor: COLORS.primary.darkPurple }}
              >
                <Text className="text-ui-white font-semibold text-base font-poppins-bold">
                  New Vibe
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Songs List with enhanced styling and animation */}
        <Animated.View style={songListAnimatedStyle}>
          <View className="px-4">
            <SongList 
              songs={exampleSongs} 
              showScrollView={false}
              scrollY={scrollY}
            />
          </View>
        </Animated.View>
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