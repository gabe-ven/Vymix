import React, { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GOOGLE_CLIENT_IDS } from "../../env";
import { useRouter } from "expo-router";
import { appleAuth } from '@invertase/react-native-apple-authentication';
import auth, { GoogleAuthProvider } from '@react-native-firebase/auth';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_CLIENT_IDS.ios,
    webClientId: GOOGLE_CLIENT_IDS.web,
  });

  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle token refresh
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      if (user) {
        setUserLoggedIn(true);
        router.replace("/(tabs)/create");
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (response?.type === "success") {
      setLoading(true);
      setError(null);
      const { idToken } = (response.authentication as { idToken?: string }) || {};
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        auth()
          .signInWithCredential(credential)
          .then(async (userCredential) => {
            // Get the user's profile information
            const user = userCredential.user;
            if (user) {
              // Update the user's profile with Google information
              await user.updateProfile({
                displayName: user.displayName || user.email?.split('@')[0],
                photoURL: user.photoURL
              });
              setUserLoggedIn(true);
              router.replace("/(tabs)/create");
            }
          })
          .catch((err) => {
            console.error("Firebase sign-in error:", err);
            setError("Failed to sign in with Google. Please try again.");
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
      const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);
    
      const userCredential = await auth().signInWithCredential(appleCredential);
      if (userCredential.user) {
        setUserLoggedIn(true);
        router.replace("/(tabs)/create");
      }
    } catch (error) {
      console.error('Apple Sign-In Error:', error);
      setError('Failed to sign in with Apple. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await auth().signInAnonymously();
      if (userCredential.user) {
        setUserLoggedIn(true);
        router.replace("/(tabs)/create");
      }
    } catch (err) {
      console.error("Anonymous sign-in error:", err);
      setError("Failed to sign in as guest. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (userLoggedIn) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-2xl font-semibold text-gray-900">
          Welcome! You are logged in.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-blue justify-center items-center px-8">
      {/* Logo Container with Glow Effect */}
      <View className="items-center mb-8">
        <View className="rounded-full p-4 bg-white/10">
          <Image
            source={require("../../assets/images/splash-icon.png")}
            className="w-56 h-56"
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Title with Enhanced Typography */}
      <Text className="text-6xl font-extrabold text-white mb-4 tracking-tight">
        VYMIX
      </Text>
      <Text className="text-2xl text-gray-200 mb-16 text-center font-medium">
        Your vibe. Your mix.
      </Text>

      {/* Error Message */}
      {error && (
        <View className="w-full mb-4 bg-red-100 p-4 rounded-xl">
          <Text className="text-red-600 text-center">{error}</Text>
        </View>
      )}

      {/* Google Login Button */}
      <TouchableOpacity
        onPress={() => promptAsync()}
        disabled={!request || loading}
        className="w-full mb-4"
      >
        <View className="bg-white rounded-2xl py-5 px-6 shadow-lg flex-row items-center justify-center">
          {loading ? (
            <ActivityIndicator color="#211c84" />
          ) : (
            <>
              <Image
                source={require("../../assets/images/google-icon.png")}
                className="w-7 h-7 mr-4"
              />
              <Text className="text-gray-800 text-center font-medium text-xl">
                Continue with Google
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Apple Login Button */}
      <TouchableOpacity
        onPress={onAppleButtonPress}
        disabled={loading}
        className="w-full mb-4"
      >
        <View className="bg-black rounded-2xl py-5 px-6 shadow-lg flex-row items-center justify-center">
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Image
                source={require("../../assets/images/apple-icon.png")}
                className="w-7 h-7 mr-4"
              />
              <Text className="text-white text-center font-medium text-xl">
                Continue with Apple
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Guest Login Button */}
      <TouchableOpacity
        onPress={handleGuestLogin}
        disabled={loading}
        className="w-full"
      >
        <View className="bg-transparent border-2 border-[#ED8770] rounded-2xl py-5 px-6">
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-center font-medium text-xl">
              Continue as Guest
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}
