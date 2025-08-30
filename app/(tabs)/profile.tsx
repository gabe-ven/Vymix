import { View, Text, TouchableOpacity, Image, Alert, Linking, ScrollView } from 'react-native';
import { Layout } from '@/app/components/Layout';
import { useAuth } from '../context/AuthContext';
import { FontAwesome, Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { COLORS } from '../constants/colors';
import Glass from '../components/Glass';
import { spotifyService, SpotifyUser } from '../../services/spotify';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);
  const router = useRouter();

  // Check Spotify connection status and fetch user data
  const checkSpotifyStatus = async () => {
    try {
      // Check if user has valid tokens (currently authenticated)
      const isAuthenticated = await spotifyService.isAuthenticated();
      
      // Treat as connected ONLY when currently authenticated
      setIsSpotifyConnected(isAuthenticated);
      
      // If currently authenticated, fetch Spotify user data
      if (isAuthenticated) {
        try {
          const currentUser = await spotifyService.getCurrentUser();
          setSpotifyUser(currentUser);
        } catch (error) {
          console.error('Error fetching Spotify user data:', error);
          setSpotifyUser(null);
        }
      } else {
        setSpotifyUser(null);
      }
    } catch (error) {
      console.error('Error checking Spotify status:', error);
      setIsSpotifyConnected(false);
      setSpotifyUser(null);
    }
  };

  useEffect(() => {
    checkSpotifyStatus();
  }, [user]);

  // Refresh Spotify status when profile tab is focused
  useFocusEffect(
    useCallback(() => {
      checkSpotifyStatus();
    }, [user])
  );

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleReconnectSpotify = async () => {
    try {
      setIsLoading(true);
      await spotifyService.loginToSpotify(user?.uid);
      setIsSpotifyConnected(true);
      
      // Fetch Spotify user data after successful login
      try {
        const currentUser = await spotifyService.getCurrentUser();
        setSpotifyUser(currentUser);
      } catch (error) {
        console.error('Error fetching Spotify user data after login:', error);
      }
      
      Alert.alert(
        'Connected! 🎉',
        'Spotify reconnected successfully.',
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
      setSpotifyUser(null);
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

  // Removed dark mode and cache handlers per request

  const handleOpenLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {}
  };



  const ActionRow = ({
    icon,
    label,
    onPress,
    showChevron = true,
    isDestructive = false,
  }: {
    icon: React.ReactElement;
    label: string;
    onPress?: () => void;
    showChevron?: boolean;
    isDestructive?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="w-full flex-row items-center justify-between bg-white/10 rounded-2xl px-5 py-5 mb-3"
    >
      <View className="flex-row items-center">
        <View className="w-6 h-6 mr-3 items-center justify-center">
          {icon}
        </View>
        <Text className={`font-poppins-bold text-base ${isDestructive ? 'text-red-400' : 'text-ui-white'}`}>{label}</Text>
      </View>
      {showChevron ? (
        <Ionicons name="chevron-forward" size={18} color={COLORS.ui.white} />
      ) : (
        <View />
      )}
    </TouchableOpacity>
  );

  return (
    <Layout>
      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        {/* Top spacing to match layout */}
        <View className="w-full h-4" />

        {/* Avatar + name/email */}
        <View className="items-center mt-4 mb-6">
          <View className="w-24 h-24 rounded-full overflow-hidden mb-3">
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <View className="w-full h-full items-center justify-center bg-white/10">
                <FontAwesome name="user" size={28} color={COLORS.ui.white} />
              </View>
            )}
          </View>
          <Text className="text-ui-white text-xl font-poppins-bold">{user?.displayName || 'User'}</Text>
          {!!user?.email && (
            <Text className="text-ui-white opacity-60 font-poppins mt-1">{user.email}</Text>
          )}
        </View>

        {/* Spotify connection card (replaces upgrade button) */}
        <Glass 
          className="rounded-2xl p-4 mb-8"
          blurAmount={25}
          backgroundColor={COLORS.transparent.white[10]}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 items-center justify-center mr-4">
                <Image
                  source={require('../../assets/images/spotify-logo.png')}
                  className="w-12 h-12"
                  resizeMode="contain"
                />
              </View>
              <View className="flex-1">
                <Text className="text-ui-white font-poppins-bold text-base">Spotify</Text>
                {isSpotifyConnected && spotifyUser ? (
                  <View className="flex-row items-center mt-1">
                    {spotifyUser.images && spotifyUser.images.length > 0 ? (
                      <Image
                        source={{ uri: spotifyUser.images[0].url }}
                        className="w-6 h-6 rounded-full mr-2"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-6 h-6 rounded-full bg-green-500 mr-2 items-center justify-center">
                        <FontAwesome name="music" size={10} color="white" />
                      </View>
                    )}
                    <Text className="text-ui-white opacity-70 font-poppins text-sm" numberOfLines={1}>
                      {spotifyUser.display_name}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-ui-white opacity-70 font-poppins text-sm">Not connected</Text>
                )}
              </View>
            </View>
            <View className="flex-row gap-3">
              {isSpotifyConnected ? (
                <TouchableOpacity
                  onPress={handleSpotifyLogout}
                  disabled={isLoading}
                  className="bg-red-500 rounded-full px-4 py-2 shadow-lg"
                >
                  <Text className="text-white font-poppins text-sm">{isLoading ? '...' : 'Disconnect'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleReconnectSpotify}
                  disabled={isLoading}
                  className="bg-green-500 rounded-full px-4 py-2 shadow-lg"
                >
                  <Text className="text-white font-poppins text-sm">{isLoading ? '...' : 'Connect'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Glass>

        {/* Action list */}
        <ActionRow icon={<Feather name="shield" size={20} color={COLORS.ui.white} />} label="Privacy" onPress={() => handleOpenLink('https://vymix.app/privacy')} />
        <ActionRow icon={<Feather name="help-circle" size={20} color={COLORS.ui.white} />} label="Help & Support" onPress={() => handleOpenLink('https://vymix.app/feedback')} />
        <ActionRow icon={<Feather name="settings" size={20} color={COLORS.ui.white} />} label="Settings" onPress={() => router.push('/settings')} />
        <ActionRow icon={<Feather name="log-out" size={20} color="#ff6b6b" />} label="Logout" onPress={handleSignOut} showChevron={false} isDestructive />

        {/* Extras removed per request */}
      </ScrollView>
    </Layout>
  );
}
 