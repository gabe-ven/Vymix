import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spotifyService } from '../../services/spotify';
import Glass from './Glass';
import { COLORS } from '../constants/colors';

interface SpotifyLoginProps {
  onLoginSuccess: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  userId?: string;
}

export const SpotifyLogin: React.FC<SpotifyLoginProps> = ({ 
  onLoginSuccess, 
  onSkip, 
  showSkip = false,
  userId
}) => {
  const [loading, setLoading] = useState(false);

  const handleSpotifyLogin = async () => {
    setLoading(true);
    try {
      await spotifyService.loginToSpotify(userId);
      onLoginSuccess();
    } catch (error) {
      console.error('Spotify login error:', error);
      Alert.alert(
        'Login Failed',
        'Failed to connect to Spotify. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center px-6">
      <View className="items-center mb-8">
        <View className="w-24 h-24 bg-green-500 rounded-full items-center justify-center mb-6">
          <Ionicons name="musical-notes" size={48} color="white" />
        </View>
        
        <Text className="text-ui-white text-2xl font-bold text-center mb-4 font-poppins-bold">
          Connect to Spotify
        </Text>
        
        <Text className="text-ui-white text-base text-center mb-8 font-poppins leading-6">
          To create and save your playlists, we need to connect to your Spotify account. 
          This allows us to create playlists directly in your Spotify library.
        </Text>
      </View>

      <View className="w-full space-y-4">
        <Glass 
          className="rounded-full"
          blurAmount={20}
          backgroundColor={COLORS.transparent.white[10]}
        >
          <TouchableOpacity
            onPress={handleSpotifyLogin}
            disabled={loading}
            className="rounded-full px-8 py-4 items-center justify-center flex-row"
          >
            {loading ? (
              <View className="flex-row items-center">
                <Ionicons name="refresh" size={20} color="white" className="animate-spin mr-2" />
                <Text className="text-ui-white font-bold text-lg font-poppins-bold ml-2">
                  Connecting...
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="musical-notes" size={24} color="white" />
                <Text className="text-ui-white font-bold text-lg font-poppins-bold ml-3">
                  Connect with Spotify
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Glass>

        {showSkip && onSkip && (
          <Glass 
            className="rounded-full"
            blurAmount={20}
            backgroundColor={COLORS.transparent.white[5]}
          >
            <TouchableOpacity
              onPress={onSkip}
              className="rounded-full px-8 py-4 items-center justify-center"
            >
              <Text className="text-ui-white font-semibold text-base font-poppins">
                Skip for now
              </Text>
            </TouchableOpacity>
          </Glass>
        )}
      </View>

      <View className="mt-8 px-4">
        <Text className="text-ui-white text-sm text-center font-poppins opacity-70">
          By connecting to Spotify, you agree to allow Vymix to create playlists in your account.
        </Text>
      </View>
    </View>
  );
}; 