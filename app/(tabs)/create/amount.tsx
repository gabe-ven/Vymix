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

    // Save song count and set generation flag
    await AsyncStorage.setItem('songCount', songCount.toString());
    await AsyncStorage.setItem('isGeneratingPlaylist', 'true');
    
    // Navigate to playlist screen where generation will happen
    router.push('/(tabs)/create/playlist');
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
            className="rounded-full shadow-lg"
            blurAmount={20}
            backgroundColor={COLORS.transparent.white[10]}
          >
            <TouchableOpacity
              onPress={handleNext}
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