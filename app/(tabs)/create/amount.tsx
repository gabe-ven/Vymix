import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Layout } from '@/app/components/Layout';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SongCountSlider from '../../components/SongCountSlider';
import { COLORS } from '../../constants/colors';
import Glass from '../../components/Glass';
import { LoadingAnimation } from '../../components/LoadingAnimation';
import { playlistService } from '../../../services/playlistService';
import { spotifyService } from '../../../services/spotify';
import { useAuth } from '../../context/AuthContext';

export default function Amount() {
  const [songCount, setSongCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleBack = () => {
    router.back();
  };

  const generatePlaylist = async () => {
    // Check if Spotify is connected
    const isAuthenticated = await spotifyService.isAuthenticated();
    const hasConnectedBefore = user?.uid ? await spotifyService.hasConnectedSpotify(user.uid) : false;
    const isSpotifyConnected = isAuthenticated || hasConnectedBefore;

    if (!isSpotifyConnected) {
      Alert.alert(
        'Connect Spotify Account',
        'You need to connect your Spotify account to create playlists with real tracks.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect Spotify', onPress: () => router.push('/(auth)/connect-spotify') }
        ]
      );
      return;
    }

    setIsGenerating(true);
    try {
      // Get stored data
      const [emojisData, vibeData] = await Promise.all([
        AsyncStorage.getItem('selectedEmojis'),
        AsyncStorage.getItem('currentVibe'),
      ]);

      const emojis = emojisData ? JSON.parse(emojisData) : [];
      const vibe = vibeData || 'Feeling good';

      console.log('Generating playlist with:', { emojis, songCount, vibe });

      // Generate complete playlist with one call
      const playlist = await playlistService.generatePlaylist(emojis, songCount, vibe);

      // Save song count and playlist data
      await AsyncStorage.setItem('songCount', songCount.toString());
      await AsyncStorage.setItem('playlistData', JSON.stringify(playlist));

      // Navigate to playlist screen
      router.push('/(tabs)/create/playlist');
    } catch (error) {
      console.error('Failed to generate playlist:', error);
      
      // Check if it's an authentication error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage && (
        errorMessage.includes('No access token available') || 
        errorMessage.includes('Access token expired') ||
        errorMessage.includes('Authentication required')
      )) {
        Alert.alert(
          'Spotify Connection Expired',
          'Your Spotify connection has expired. Please reconnect to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reconnect', onPress: () => router.push('/(auth)/connect-spotify') }
          ]
        );
        return;
      }
      
      Alert.alert(
        'Generation Failed',
        'Failed to generate playlist. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = async () => {
    await generatePlaylist();
  };

  // Show loading animation while generating
  if (isGenerating) {
    return (
      <Layout>
        <View className="flex-1 justify-center items-center px-4">
          <LoadingAnimation 
            message="Creating your perfect playlist..."
            size="large"
          />
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <TouchableOpacity
        onPress={handleBack}
        className="absolute top-12 left-4 z-10 p-2"
      >
        <Ionicons name="chevron-back" size={28} color={COLORS.ui.white} />
      </TouchableOpacity>
      
      <View className="w-full h-full pt-20 px-4 flex items-center justify-center">
        <Text className="text-4xl md:text-5xl font-bold text-ui-white mb-8 text-center px-4 font-poppins-bold">
          How many songs?
        </Text>
        
        <SongCountSlider 
          onValueChange={setSongCount}
          initialValue={10}
        />
        
        <View className="mt-12">
          <Glass 
            className="rounded-full shadow-lg"
            blurAmount={20}
            backgroundColor={COLORS.transparent.white[10]}
          >
            <TouchableOpacity
              onPress={handleNext}
              disabled={isGenerating}
              className="rounded-full px-8 py-4 items-center justify-center"
            >
              <Text className="text-ui-white font-semibold text-xl font-poppins-bold">
                Create Playlist
              </Text>
            </TouchableOpacity>
          </Glass>
        </View>
      </View>
    </Layout>
  );
}