import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Layout } from '@/app/components/Layout';
import { useAuth } from '../context/AuthContext';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/colors';
import Glass from '../components/Glass';
import { spotifyService } from '../../services/spotify';
import { useState, useEffect } from 'react';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check Spotify connection status
    const checkSpotifyStatus = async () => {
      try {
        const isConnected = spotifyService.isAuthenticated();
        setIsSpotifyConnected(isConnected);
      } catch (error) {
        console.error('Error checking Spotify status:', error);
        setIsSpotifyConnected(false);
      }
    };
    
    checkSpotifyStatus();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSpotifyLogin = async () => {
    try {
      setIsLoading(true);
      await spotifyService.loginToSpotify(user?.uid);
      setIsSpotifyConnected(true);
      Alert.alert(
        'Connected! 🎉',
        'You are now connected to Spotify and can create playlists!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Spotify login failed:', error);
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Spotify. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpotifyLogout = async () => {
    try {
      setIsLoading(true);
      await spotifyService.logout();
      
      // Also clear the connection status flag
      if (user?.uid) {
        await spotifyService.clearConnectionStatus(user.uid);
      }
      
      setIsSpotifyConnected(false);
      Alert.alert(
        'Disconnected',
        'You have been disconnected from Spotify.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Spotify logout failed:', error);
      Alert.alert(
        'Error',
        'Failed to disconnect from Spotify.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <View className="flex-1 p-4 md:p-6 pb-24">
        {/* Profile Header */}
        <View className="items-center mt-12 md:mt-16 mb-6 md:mb-8">
          <View className="w-20 h-20 md:w-24 md:h-24 bg-background-darker rounded-full items-center justify-center mb-4 overflow-hidden">
            {user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <FontAwesome name="user" size={32} color={COLORS.ui.gray.dark} />
            )}
          </View>
          <Text className="text-xl md:text-2xl font-bold text-ui-white mb-2 text-center px-4 font-poppins-bold">
            {user?.displayName || user?.email?.split('@')[0] || 'User'}
          </Text>
        </View>

        {/* Spotify Connection Section */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-ui-white mb-4 font-poppins-bold">
            Music Services
          </Text>
          
          <Glass 
            className="rounded-xl p-4 mb-4"
            blurAmount={20}
            backgroundColor={COLORS.transparent.white[10]}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-12 h-12 items-center justify-center mr-4">
                  <Image
                    source={require('../../assets/images/spotify-logo.png')}
                    className="w-12 h-12"
                    resizeMode="contain"
                  />
                </View>
                <View>
                  <Text className="text-ui-white font-semibold text-base font-poppins-bold">
                    Spotify
                  </Text>
                  <Text className="text-ui-white text-sm font-poppins opacity-70">
                    {isSpotifyConnected ? 'Connected' : 'Not connected'}
                  </Text>
                </View>
              </View>
              
              {isSpotifyConnected ? (
                <TouchableOpacity
                  onPress={handleSpotifyLogout}
                  disabled={isLoading}
                  className="bg-red-500 rounded-full px-4 py-2"
                >
                  <Text className="text-white font-semibold text-sm font-poppins">
                    {isLoading ? 'Disconnecting...' : 'Disconnect'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleSpotifyLogin}
                  disabled={isLoading}
                  className="bg-green-500 rounded-full px-4 py-2"
                >
                  <Text className="text-white font-semibold text-sm font-poppins">
                    {isLoading ? 'Connecting...' : 'Connect'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Glass>
        </View>

        {/* Logout Button */}
        <View className="space-y-3">
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-red-500 rounded-xl py-3 md:py-4 px-6 mx-4"
          >
            <Text className="text-ui-white text-center font-semibold text-base md:text-lg font-poppins">
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Layout>
  );
}
 