import React, { useEffect, useState } from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GOOGLE_CLIENT_IDS } from '../../env';
import { useRouter } from 'expo-router';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import auth, { GoogleAuthProvider } from '@react-native-firebase/auth';
import { Glass } from '../components/Glass';
import { COLORS } from '../constants/colors';
import { spotifyService } from '../../services/spotify';
import { Layout } from '../components/Layout';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_CLIENT_IDS.ios,
    androidClientId: (GOOGLE_CLIENT_IDS as any).android,
    webClientId: GOOGLE_CLIENT_IDS.web,
  });

  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check Spotify connection and route accordingly
  const checkSpotifyAndRoute = async (user: any) => {
    try {
      const hasConnected = await spotifyService.hasConnectedSpotify(user.uid);

      if (hasConnected) {
        // User has connected Spotify before, go directly to main app
        router.replace('/(tabs)/create');
      } else {
        // User hasn't connected Spotify before, go to connect page
        router.replace('/(auth)/connect-spotify');
      }
    } catch (error) {
      console.error('Error checking Spotify connection:', error);
      // Default to connect page if there's an error
      router.replace('/(auth)/connect-spotify');
    }
  };

  // Handle token refresh
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      if (user) {
        setUserLoggedIn(true);
        checkSpotifyAndRoute(user);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      setLoading(true);
      setError(null);
      const { idToken } =
        (response.authentication as { idToken?: string }) || {};
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        auth()
          .signInWithCredential(credential)
          .then(async (userCredential) => {
            const user = userCredential.user;
            if (user) {
              await user.updateProfile({
                displayName: user.displayName || user.email?.split('@')[0],
                photoURL: user.photoURL,
              });
              setUserLoggedIn(true);
            }
          })
          .catch((err) => {
            console.error('Firebase sign-in error:', err);
            setError('Failed to sign in with Google. Please try again.');
          })
          .finally(() => setLoading(false));
      }
    }
  }, [response]);

  async function onAppleButtonPress() {
    try {
      setLoading(true);
      setError(null);
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Sign-In failed - no identify token returned');
      }

      const { identityToken, nonce } = appleAuthRequestResponse;
      const appleCredential = auth.AppleAuthProvider.credential(
        identityToken,
        nonce
      );

      const userCredential = await auth().signInWithCredential(appleCredential);
      if (userCredential.user) {
        setUserLoggedIn(true);
      }
    } catch (error) {
      console.error('Apple Sign-In Error:', error);
      setError('Failed to sign in with Apple. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      {/* Main Content Container */}
      <View
        style={{
          flex: 1,
          justifyContent: 'space-between',
          paddingTop: 120,
          paddingBottom: 80,
        }}
      >
        {/* Header Section */}
        <View className="px-6">
          <Text className="text-6xl md:text-7xl text-ui-white font-medium font-poppins leading-tight">
            Your vibe.
          </Text>
          <Text className="text-6xl md:text-7xl text-ui-white font-medium font-poppins leading-tight mt-2">
            Your mix.
          </Text>

          <Text className="text-7xl md:text-8xl font-extrabold text-ui-white mt-8 mb-4 tracking-tight font-poppins-bold">
            VYMIX
          </Text>

          <Text className="text-xl text-ui-white opacity-90 font-poppins leading-relaxed max-w-sm">
            Create personalized playlists that match your unique energy
          </Text>
        </View>

        {/* Login Section */}
        <View className="px-6 space-y-6">
          {error && (
            <View className="w-full mb-2 bg-red-500/20 p-4 rounded-2xl border border-red-500/30">
              <Text className="text-red-300 text-center font-poppins">
                {error}
              </Text>
            </View>
          )}

          {/* Google Sign In Button */}
          <TouchableOpacity
            onPress={() => promptAsync()}
            disabled={!request || loading}
            className="w-full"
            activeOpacity={0.8}
          >
            <Glass
              className="rounded-3xl py-5 px-6 mb-4 shadow-lg"
              blurAmount={20}
              backgroundColor={COLORS.transparent.white[10]}
            >
              <View className="flex-row items-center justify-center">
                {loading ? (
                  <ActivityIndicator color={COLORS.ui.white} size="large" />
                ) : (
                  <>
                    <Image
                      source={require('../../assets/images/google-icon.png')}
                      className="w-7 h-7 mr-4"
                    />
                    <Text className="text-ui-white text-center font-semibold text-xl font-poppins-bold">
                      Continue with Google
                    </Text>
                  </>
                )}
              </View>
            </Glass>
          </TouchableOpacity>

          {/* Apple Sign In Button */}
          <TouchableOpacity
            onPress={onAppleButtonPress}
            disabled={loading}
            className="w-full"
            activeOpacity={0.8}
          >
            <Glass
              className="rounded-3xl py-5 px-6 shadow-lg"
              blurAmount={20}
              backgroundColor={COLORS.transparent.white[5]}
            >
              <View className="flex-row items-center justify-center">
                {loading ? (
                  <ActivityIndicator color={COLORS.ui.white} size="large" />
                ) : (
                  <>
                    <Image
                      source={require('../../assets/images/apple-icon.png')}
                      className="w-7 h-7 mr-4"
                    />
                    <Text className="text-ui-white text-center font-semibold text-xl font-poppins-bold">
                      Continue with Apple
                    </Text>
                  </>
                )}
              </View>
            </Glass>
          </TouchableOpacity>

          {/* Terms and Privacy */}
          <View className="mt-6 px-4">
            <Text className="text-ui-white text-center opacity-60 font-poppins text-sm leading-relaxed">
              By continuing, you agree to our{' '}
              <Text 
                className="text-ui-white opacity-80 underline"
                onPress={() => Linking.openURL('https://vymix.app/terms-of-service')}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text 
                className="text-ui-white opacity-80 underline"
                onPress={() => Linking.openURL('https://vymix.app/privacy-policy')}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </Layout>
  );
}
