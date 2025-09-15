import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
  Linking,
} from 'react-native';
import { Layout } from '@/app/components/Layout';
import Glass from '@/app/components/Glass';
import { COLORS } from '@/app/constants/colors';
import { useAuth } from '@/app/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { spotifyService } from '@/services/spotify';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
import { GOOGLE_CLIENT_IDS } from '../env';
import { appleAuth } from '@invertase/react-native-apple-authentication';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Settings state
  const [playlistPrivacy, setPlaylistPrivacy] = useState(true); // true = public, false = private
  const [autoSaveSpotify, setAutoSaveSpotify] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user?.uid) return;

    try {
      const privacy = await AsyncStorage.getItem(
        `playlist_privacy_${user.uid}`
      );
      const autoSave = await AsyncStorage.getItem(
        `auto_save_spotify_${user.uid}`
      );

      setPlaylistPrivacy(privacy !== 'false'); // Default to public
      setAutoSaveSpotify(autoSave === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (key: string, value: string) => {
    if (!user?.uid) return;

    try {
      await AsyncStorage.setItem(`${key}_${user.uid}`, value);
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const handlePlaylistPrivacyChange = (value: boolean) => {
    setPlaylistPrivacy(value);
    saveSettings('playlist_privacy', value.toString());
  };

  const handleAutoSaveChange = (value: boolean) => {
    setAutoSaveSpotify(value);
    saveSettings('auto_save_spotify', value.toString());
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear your local cache and preferences. You may need to reconnect to Spotify.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user?.uid) {
                await AsyncStorage.removeItem(`playlist_cache_${user.uid}`);
                await AsyncStorage.removeItem(`spotify_connected_${user.uid}`);
                await AsyncStorage.removeItem(`playlist_privacy_${user.uid}`);
                await AsyncStorage.removeItem(`auto_save_spotify_${user.uid}`);
              }
              Alert.alert(
                'Cleared',
                'Local cache and preferences were cleared.'
              );
              loadSettings(); // Reload settings
            } catch (e) {
              Alert.alert('Error', 'Failed to clear cache.');
            }
          },
        },
      ]
    );
  };

  const handleClearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete ALL your playlists, cache, and preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);

              if (user?.uid) {
                // Clear Firestore playlists (using correct collection structure)
                const playlistsRef = firestore()
                  .collection('playlists')
                  .where('userId', '==', user.uid);

                const snapshot = await playlistsRef.get();

                if (!snapshot.empty) {
                  const batch = firestore().batch();

                  snapshot.forEach((doc) => {
                    batch.delete(doc.ref);
                  });

                  await batch.commit();
                  console.log(
                    `Deleted ${snapshot.size} playlists from Firestore`
                  );
                } else {
                  console.log('📭 No playlists found to delete');
                }

                // Clear all local storage
                const keys = await AsyncStorage.getAllKeys();
                const userKeys = keys.filter((key) => key.includes(user.uid));
                await AsyncStorage.multiRemove(userKeys);

                // Note: Keeping Spotify connection active
                console.log('🎵 Spotify connection maintained');
              }

              Alert.alert(
                'Success',
                'All data has been cleared. Spotify connection maintained.'
              );
              loadSettings();
            } catch (error) {
              console.error('Error clearing all data:', error);
              Alert.alert('Error', 'Failed to clear all data.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const reauthenticateUser = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Re-authentication Required',
        'For security, please confirm your identity before deleting your account.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Re-authenticate',
            onPress: async () => {
              try {
                const currentUser = auth().currentUser;
                if (!currentUser) {
                  resolve(false);
                  return;
                }

                // Get current provider data
                const providerData = currentUser.providerData;
                const isGoogleUser = providerData.some(
                  (provider) => provider.providerId === 'google.com'
                );
                const isAppleUser = providerData.some(
                  (provider) => provider.providerId === 'apple.com'
                );

                if (isAppleUser) {
                  // Re-authenticate with Apple Sign-In
                  try {
                    const appleAuthRequestResponse =
                      await appleAuth.performRequest({
                        requestedOperation: appleAuth.Operation.LOGIN,
                        requestedScopes: [
                          appleAuth.Scope.FULL_NAME,
                          appleAuth.Scope.EMAIL,
                        ],
                      });

                    if (!appleAuthRequestResponse.identityToken) {
                      throw new Error(
                        'Apple re-authentication failed - no identity token'
                      );
                    }

                    const { identityToken, nonce } = appleAuthRequestResponse;
                    const appleCredential = auth.AppleAuthProvider.credential(
                      identityToken,
                      nonce
                    );
                    await currentUser.reauthenticateWithCredential(
                      appleCredential
                    );

                    console.log('Apple re-authentication successful');
                    resolve(true);
                  } catch (appleError) {
                    console.error(
                      'Apple re-authentication failed:',
                      appleError
                    );
                    Alert.alert(
                      'Error',
                      'Apple re-authentication failed. Please try again.'
                    );
                    resolve(false);
                  }
                } else if (isGoogleUser) {
                  // For Google users, we need them to sign in again for re-authentication
                  Alert.alert(
                    'Re-authentication Required',
                    'Please sign out and sign back in to confirm your identity before deleting your account.',
                    [{ text: 'OK' }]
                  );
                  resolve(false);
                } else {
                  // For other providers (email/password), we'll need the user to sign in again
                  Alert.alert(
                    'Sign In Required',
                    'Please sign out and sign back in, then try deleting your account again.',
                    [{ text: 'OK' }]
                  );
                  resolve(false);
                }
              } catch (error) {
                console.error('Re-authentication failed:', error);
                Alert.alert(
                  'Error',
                  'Re-authentication failed. Please try again.'
                );
                resolve(false);
              }
            },
          },
        ]
      );
    });
  };


  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);

              // First, re-authenticate the user for security
              const isReauthenticated = await reauthenticateUser();
              if (!isReauthenticated) {
                setLoading(false);
                return;
              }

              if (user?.uid) {
                // Clear all user data first
                console.log('Clearing all user data...');

                // Clear Firestore playlists (using correct collection structure)
                const playlistsRef = firestore()
                  .collection('playlists')
                  .where('userId', '==', user.uid);

                const snapshot = await playlistsRef.get();

                if (!snapshot.empty) {
                  const batch = firestore().batch();

                  snapshot.forEach((doc) => {
                    batch.delete(doc.ref);
                  });

                  await batch.commit();
                  console.log(
                    `Deleted ${snapshot.size} playlists from Firestore`
                  );
                } else {
                  console.log('📭 No playlists found to delete');
                }

                // Clear all local storage
                const keys = await AsyncStorage.getAllKeys();
                const userKeys = keys.filter((key) => key.includes(user.uid));
                await AsyncStorage.multiRemove(userKeys);

                // Clear Spotify tokens
                await spotifyService.logout();

                console.log('Deleting Firebase user account...');

                // Delete Firebase user account
                const currentUser = auth().currentUser;
                if (currentUser) {
                  await currentUser.delete();
                }

                console.log('Account deleted successfully');
                Alert.alert(
                  'Account Deleted',
                  'Your account has been permanently deleted.'
                );
              }

              // Sign out and redirect
              await signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error deleting account:', error);

              // Handle specific Firebase errors
              if ((error as any)?.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Re-authentication Required',
                  'For security, please sign out and sign back in, then try deleting your account again.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert(
                  'Error',
                  'Failed to delete account. Please try again or contact support.'
                );
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const SettingsRow = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
    destructive = false,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center py-4 px-4 bg-white/5 rounded-xl mb-3"
      disabled={!onPress && !rightElement}
    >
      <View className="w-8 h-8 items-center justify-center mr-4">
        <Ionicons
          name={icon as any}
          size={20}
          color={destructive ? '#ff6b6b' : COLORS.ui.white}
        />
      </View>

      <View className="flex-1">
        <Text
          className={`font-poppins-bold ${destructive ? 'text-red-400' : 'text-white'}`}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="text-white/60 font-poppins text-sm mt-1">
            {subtitle}
          </Text>
        )}
      </View>

      {rightElement ||
        (onPress && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color="rgba(255, 255, 255, 0.4)"
          />
        ))}
    </TouchableOpacity>
  );

  return (
    <Layout>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {/* Header */}
          <View className="relative items-center justify-center mb-8 mt-10">
            <TouchableOpacity
              onPress={() => router.back()}
              className="absolute left-0 p-2"
            >
              <Ionicons name="chevron-back" size={28} color={COLORS.ui.white} />
            </TouchableOpacity>
            <Text className="text-ui-white text-xl font-poppins-bold">
              Settings
            </Text>
          </View>

          {/* Playlist Preferences */}
          <Glass
            className="rounded-xl p-5 mb-6"
            blurAmount={25}
            backgroundColor={COLORS.transparent.white[10]}
          >
            <Text className="text-ui-white font-poppins-bold text-lg mb-4">
              Playlist Preferences
            </Text>

            <SettingsRow
              icon="lock-open"
              title="Default Playlist Privacy"
              subtitle={
                playlistPrivacy
                  ? 'New playlists will be public'
                  : 'New playlists will be private'
              }
              rightElement={
                <Switch
                  value={playlistPrivacy}
                  onValueChange={handlePlaylistPrivacyChange}
                  trackColor={{ false: '#4a4a4a', true: COLORS.primary.lime }}
                  thumbColor={playlistPrivacy ? '#ffffff' : '#f4f3f4'}
                />
              }
            />

            <SettingsRow
              icon="cloud-upload"
              title="Auto-save to Spotify"
              subtitle={
                autoSaveSpotify
                  ? 'Automatically save playlists to Spotify when created'
                  : 'Manually save playlists to Spotify'
              }
              rightElement={
                <Switch
                  value={autoSaveSpotify}
                  onValueChange={handleAutoSaveChange}
                  trackColor={{ false: '#4a4a4a', true: COLORS.primary.lime }}
                  thumbColor={autoSaveSpotify ? '#ffffff' : '#f4f3f4'}
                />
              }
            />
          </Glass>

          {/* Data Management */}
          <Glass
            className="rounded-xl p-5 mb-6"
            blurAmount={25}
            backgroundColor={COLORS.transparent.white[10]}
          >
            <Text className="text-ui-white font-poppins-bold text-lg mb-4">
              Data Management
            </Text>

            <SettingsRow
              icon="refresh"
              title="Clear Cache"
              subtitle="Clear local cache and reconnection data"
              onPress={handleClearCache}
            />

            <SettingsRow
              icon="trash"
              title="Clear All Data"
              subtitle="Delete all playlists and preferences"
              onPress={handleClearAllData}
              destructive
            />
          </Glass>

          {/* App Information */}
          <Glass
            className="rounded-xl p-5 mb-6"
            blurAmount={25}
            backgroundColor={COLORS.transparent.white[10]}
          >
            <Text className="text-ui-white font-poppins-bold text-lg mb-4">
              App Information
            </Text>

            <SettingsRow
              icon="information-circle"
              title="App Version"
              subtitle="Version 1.0.0"
            />

            <SettingsRow
              icon="help-circle"
              title="Help & Support"
              subtitle="Get help with using Vymix"
              onPress={() =>
                Alert.alert('Help', 'Contact support at support@vymixapp.com')
              }
            />

            <SettingsRow
              icon="document-text"
              title="Terms of Service"
              subtitle="View our terms and conditions"
              onPress={() => Linking.openURL('https://gabe-ven.github.io/Vymix/terms-of-service.html')}
            />

            <SettingsRow
              icon="shield-checkmark"
              title="Privacy Policy"
              subtitle="View our privacy policy and data practices"
              onPress={() => Linking.openURL('https://gabe-ven.github.io/Vymix/privacy-policy.html')}
            />
          </Glass>

          {/* Danger Zone */}
          <Glass
            className="rounded-xl p-5 mb-8"
            blurAmount={25}
            backgroundColor="rgba(255, 107, 107, 0.1)"
          >
            <Text className="text-red-400 font-poppins-bold text-lg mb-4">
              Danger Zone
            </Text>

            <SettingsRow
              icon="person-remove"
              title="Delete Account"
              subtitle="Permanently delete your account and all data"
              onPress={handleDeleteAccount}
              destructive
            />
          </Glass>
        </View>
      </ScrollView>
    </Layout>
  );
}
