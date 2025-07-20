import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { spotifyService } from '../../services/spotify';
import { Layout } from '../components/Layout';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
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
      <SafeAreaWrapper className="flex-1">
        <View className="flex-1 justify-center items-center px-6">
          {/* Header Section */}
          <View className="mb-8 items-center">
            <Text className="text-4xl font-bold text-ui-white text-center mb-4 font-poppins-bold leading-tight">
              Welcome to Vymix
            </Text>
            <Text className="text-lg text-ui-white text-center opacity-90 font-poppins leading-relaxed max-w-sm">
              Connect your Spotify account to create personalized playlists
            </Text>
          </View>

          {/* Spotify Logo Section */}
          <View className="mb-6 items-center">
            <Image
              source={require('../../assets/images/spotify-logo.png')}
              className="w-16 h-16 mb-4"
              resizeMode="contain"
            />
            <Text className="text-xl font-semibold text-ui-white font-poppins-bold">
              Connect with Spotify
            </Text>
          </View>

          {/* Simple Benefits */}
          <View className="mb-8 w-full max-w-sm">
            <View className="space-y-3">
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary.lime} />
                <Text className="text-ui-white font-poppins flex-1 leading-relaxed ml-3 text-base">
                  Real Spotify tracks based on your vibe
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary.lime} />
                <Text className="text-ui-white font-poppins flex-1 leading-relaxed ml-3 text-base">
                  Save playlists to your account
                </Text>
              </View>
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View className="w-full mb-4 bg-red-500/20 p-3 rounded-xl border border-red-500/30">
              <Text className="text-red-300 text-center font-poppins text-sm">{error}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="w-full space-y-4">
            {/* Connect Button */}
            <TouchableOpacity
              onPress={handleConnectSpotify}
              disabled={connecting}
              className="w-full"
              activeOpacity={0.8}
            >
              <Glass 
                className="rounded-2xl py-4 px-6 shadow-lg"
                blurAmount={20}
                backgroundColor={COLORS.transparent.white[10]}
              >
                <View className="flex-row items-center justify-center">
                  {connecting ? (
                    <ActivityIndicator color={COLORS.ui.white} size="large" />
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
              activeOpacity={0.6}
            >
              <View className="py-4 px-6">
                <Text className="text-ui-white text-center opacity-70 font-poppins text-base">
                  Continue without Spotify
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer Note */}
          <View className="mt-6 px-4">
            <Text className="text-ui-white text-center opacity-50 font-poppins text-xs leading-relaxed">
              You can connect Spotify later in your profile
            </Text>
          </View>
        </View>
      </SafeAreaWrapper>
    </Layout>
  );
} 