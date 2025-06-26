import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { spotifyService } from '../../services/spotify';
import { Layout } from '../components/Layout';
import { Glass } from '../components/Glass';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function ConnectSpotifyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnectSpotify = async () => {
    try {
      setConnecting(true);
      setError(null);
      
      await spotifyService.loginToSpotify(user?.uid);
      
      // Navigate directly to main app
      router.replace('/(tabs)/create');
    } catch (error) {
      console.error('Spotify connection failed:', error);
      setError('Failed to connect to Spotify. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleSkipSpotify = async () => {
    // Mark user as connected even if they skip (so they don't see this page again)
    if (user?.uid) {
      await spotifyService.markAsConnected(user.uid);
    }
    
    // Navigate directly to main app
    router.replace('/(tabs)/create');
  };

  return (
    <Layout>
      <View className="flex-1 justify-center items-center px-6">
        {/* Header */}
        <View className="mb-12">
          <Text className="text-4xl font-bold text-ui-white text-center mb-4 font-poppins-bold">
            Connect with Spotify
          </Text>
          <Text className="text-lg text-ui-white text-center opacity-80 font-poppins">
            Connect your Spotify account to generate personalized playlists with real tracks
          </Text>
        </View>

        {/* Spotify Logo */}
        <View className="mb-8">
          <Image
            source={require('../../assets/images/spotify-logo.png')}
            className="w-24 h-24"
            resizeMode="contain"
          />
        </View>

        {/* Benefits */}
        <View className="mb-8 w-full">
          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary.lime} />
              <Text className="text-ui-white ml-3 font-poppins">Real Spotify tracks based on your vibe</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary.lime} />
              <Text className="text-ui-white ml-3 font-poppins">Save playlists directly to your account</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary.lime} />
              <Text className="text-ui-white ml-3 font-poppins">Access your music library</Text>
            </View>
          </View>
        </View>

        {error && (
          <View className="w-full mb-6 bg-red-500/20 p-4 rounded-xl border border-red-500/30">
            <Text className="text-red-300 text-center font-poppins">{error}</Text>
          </View>
        )}

        {/* Connect Button */}
        <TouchableOpacity
          onPress={handleConnectSpotify}
          disabled={connecting}
          className="w-full mb-4"
        >
          <Glass 
            className="rounded-2xl py-4 px-6"
            blurAmount={20}
            backgroundColor={COLORS.transparent.white[10]}
          >
            <View className="flex-row items-center justify-center">
              {connecting ? (
                <ActivityIndicator color={COLORS.ui.white} />
              ) : (
                <>
                  <Image
                    source={require('../../assets/images/spotify-logo.png')}
                    className="w-6 h-6"
                    resizeMode="contain"
                  />
                  <Text className="text-ui-white text-center font-semibold text-lg ml-3 font-poppins-bold">
                    Connect with Spotify
                  </Text>
                </>
              )}
            </View>
          </Glass>
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity
          onPress={handleSkipSpotify}
          disabled={connecting}
          className="w-full"
        >
          <View className="py-4 px-6">
            <Text className="text-ui-white text-center opacity-60 font-poppins">
              Skip for now
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </Layout>
  );
} 