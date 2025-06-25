import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Animated, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
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

const Playlist = () => {
  const router = useRouter();
  const { playlistData, loading, error, generatePlaylist, resetPlaylist } = usePlaylistGeneration();
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const [coverOpacity] = useState(new Animated.Value(1));
  const [titleOpacity] = useState(new Animated.Value(1));
  const [descriptionOpacity] = useState(new Animated.Value(1));

  // Create gradient colors from playlist color palette
  const getGradientColors = () => {
    if (!playlistData?.colorPalette || playlistData.colorPalette.length === 0) {
      return [COLORS.primary.darkPurple, COLORS.primary.lime, COLORS.ui.black];
    }

    // Use the AI-generated color palette from user input
    return playlistData.colorPalette;
  };

  // Handle scroll events
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        
        // Fade out cover, title, and description as user scrolls
        const fadeOutValue = Math.max(0, 1 - (offsetY / 200));
        coverOpacity.setValue(fadeOutValue);
        titleOpacity.setValue(fadeOutValue);
        descriptionOpacity.setValue(fadeOutValue);
      }
    }
  );

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
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Animated Playlist Header */}
        <Animated.View 
          style={{ 
            opacity: coverOpacity,
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [0, 200],
                  outputRange: [0, -50],
                  extrapolate: 'clamp'
                })
              },
              {
                scale: scrollY.interpolate({
                  inputRange: [0, 200],
                  outputRange: [1, 0.95],
                  extrapolate: 'clamp'
                })
              }
            ]
          }}
        >
          <PlaylistCard
            name={playlistData?.name || 'My Playlist'}
            description={playlistData?.description || 'A great mix of songs'}
            songCount={playlistData?.songCount || 10}
            isSelected={true}
          />
        </Animated.View>

        {/* Floating Title that appears when scrolling */}
        <Animated.View 
          className="absolute top-20 left-4 right-4 z-10"
          style={{
            opacity: scrollY.interpolate({
              inputRange: [150, 250],
              outputRange: [0, 1],
              extrapolate: 'clamp'
            }),
            transform: [{
              translateY: scrollY.interpolate({
                inputRange: [150, 250],
                outputRange: [20, 0],
                extrapolate: 'clamp'
              })
            }]
          }}
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

        {/* Songs List with enhanced styling */}
        <View className="px-4 mt-6">
          <SongList 
            songs={exampleSongs} 
            showScrollView={false}
          />
        </View>
      </Animated.ScrollView>

      {/* Action Buttons - Fixed at bottom above tab bar */}
      <View className="absolute bottom-32 left-4 right-4 space-y-6 z-50">
        <TouchableOpacity
          onPress={handleCreatePlaylist}
          className="rounded-full px-8 py-4 items-center justify-center"
          style={{ backgroundColor: COLORS.primary.lime }}
        >
          <Text className="text-ui-black font-bold text-xl font-poppins-bold">
            Save Playlist
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRetry}
          className="rounded-full px-8 py-4 mt-4 items-center justify-center"
          style={{ backgroundColor: COLORS.primary.darkPurple }}
        >
          <Text className="text-ui-white font-semibold text-xl font-poppins-bold">
            Create New Vibe
          </Text>
        </TouchableOpacity>
      </View>
    </GradientBackground>
  );
};

export default Playlist;