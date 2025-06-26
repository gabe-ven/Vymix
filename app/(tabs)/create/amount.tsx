import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Layout } from '@/app/components/Layout';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SongCountSlider from '../../components/SongCountSlider';
import { COLORS } from '../../constants/colors';
import Glass from '../../components/Glass';
import { generatePlaylistInfo, generatePlaylistCover } from '../../../services/openai';
import { playlistGenerator } from '../../../services/playlistGenerator';
import { spotifyService } from '../../../services/spotify';

export default function Amount() {
  const [songCount, setSongCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const generatePlaylist = async () => {
    // Check if Spotify is connected before generating playlist
    if (!spotifyService.isAuthenticated()) {
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

      // Generate playlist info using OpenAI
      const playlistInfo = await generatePlaylistInfo({
        emojis,
        songCount,
        vibe,
      });

      // Generate cover image
      let coverImageUrl;
      try {
        coverImageUrl = await generatePlaylistCover(emojis, vibe, playlistInfo.name, playlistInfo.colorPalette);
      } catch (error) {
        console.warn('Failed to generate cover image:', error);
      }

      // Generate tracks using Spotify API only
      const tracks = await playlistGenerator.generateTracksOnly(emojis, songCount, vibe);
      console.log('Generated tracks:', tracks.length);

      // Save all data to AsyncStorage
      await AsyncStorage.setItem('songCount', songCount.toString());
      await AsyncStorage.setItem('playlistData', JSON.stringify({
        name: playlistInfo.name,
        description: playlistInfo.description,
        colorPalette: playlistInfo.colorPalette,
        keywords: playlistInfo.keywords,
        coverImageUrl,
        emojis,
        songCount: tracks.length,
        vibe,
        tracks,
        isSpotifyPlaylist: false,
      }));

      // Navigate to playlist screen
      router.push('/(tabs)/create/playlist');
    } catch (error) {
      console.error('Failed to generate playlist:', error);
      alert('Failed to generate playlist. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = async () => {
    await generatePlaylist();
  };

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
            className="rounded-full"
            blurAmount={20}
            backgroundColor={COLORS.transparent.white[10]}
          >
            <TouchableOpacity
              onPress={handleNext}
              disabled={isGenerating}
              className="rounded-full px-8 py-4 items-center justify-center"
            >
              <Text className="text-ui-white font-semibold text-xl font-poppins-bold">
                {isGenerating ? 'Creating...' : 'Create Playlist'}
              </Text>
            </TouchableOpacity>
          </Glass>
        </View>
      </View>
    </Layout>
  );
}