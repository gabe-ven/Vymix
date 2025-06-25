import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Layout } from '@/app/components/Layout';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePlaylistGeneration } from '../../hooks/usePlaylistGeneration';
import { LoadingAnimation } from '../../components/LoadingAnimation';
import PlaylistCard from '../../components/PlaylistCard';
import SongList from '../../components/SongList';
import GradientBackground from '../../components/GradientBackground';
import { COLORS } from '../../constants/colors';
import { ANIMATION } from '../../constants/animations';
import { useFadeSlideIn } from '../../hooks/useFadeSlideIn';
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

const Playlist = () => {
  const router = useRouter();
  const { playlistData, loading, error, generatePlaylist, resetPlaylist } = usePlaylistGeneration();
  
  // Reanimated shared values
  const scrollY = useSharedValue(0);

  // Animation values for the pop-up effect
  const playlistCardScale = useSharedValue(0);
  const playlistCardOpacity = useSharedValue(0);
  const songListOpacity = useSharedValue(0);
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

    // Use the AI-generated color palette from user input
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
      [0, -40], // Reduced from -80 for less dramatic movement
      Extrapolate.CLAMP
    );

    const rotateX = interpolate(
      scrollY.value,
      ANIMATION.SCROLL.FADE_RANGE,
      [0, ANIMATION.TRANSFORM.ROTATE_X * 0.5], // Reduced rotation for subtler effect
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

    // More gradual opacity fade - starts fading later and fades more slowly
    const fadeOpacity = interpolate(
      scrollY.value,
      [100, 400], // Start fading at 100px instead of 0, end at 400px
      [1, 0.3], // Don't fade completely to 0, stop at 0.3
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

  const songListAnimatedStyle = useFadeSlideIn(songListOpacity, {
    startTranslateY: ANIMATION.TRANSFORM.START_TRANSLATE_Y
  });

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
          <Glass 
            className="rounded-full"
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
        <Animated.View style={buttonsAnimatedStyle}>
          <View className="px-4 mb-4">
            <View className="flex-row justify-center">
              <Glass 
                className="rounded-full mr-4"
                blurAmount={20}
                backgroundColor={COLORS.transparent.white[10]}
              >
                <TouchableOpacity
                  onPress={handleCreatePlaylist}
                  className="rounded-full px-6 py-3 items-center justify-center"
                >
                  <Text className="text-ui-white font-bold text-base font-poppins-bold">
                    Save
                  </Text>
                </TouchableOpacity>
              </Glass>

              <Glass 
                className="rounded-full mr-4"
                blurAmount={20}
                backgroundColor={COLORS.transparent.white[10]}
              >
                <TouchableOpacity
                  onPress={handleRegenerate}
                  className="rounded-full px-6 py-3 items-center justify-center"
                >
                  <Text className="text-ui-white font-semibold text-base font-poppins-bold">
                    Regenerate
                  </Text>
                </TouchableOpacity>
              </Glass>

              <Glass 
                className="rounded-full"
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