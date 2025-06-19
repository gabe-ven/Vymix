import React, { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GOOGLE_CLIENT_IDS } from "../../env";
import { useRouter } from "expo-router";
import { appleAuth } from '@invertase/react-native-apple-authentication';
import auth, { GoogleAuthProvider } from '@react-native-firebase/auth';
import { TopWave, BottomWave } from "../components/Wave";

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
            const user = userCredential.user;
            if (user) {
              await user.updateProfile({
                displayName: user.displayName || user.email?.split('@')[0],
                photoURL: user.photoURL
              });
              setUserLoggedIn(true);
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
      }
    } catch (err) {
      console.error("Anonymous sign-in error:", err);
      setError("Failed to sign in as guest. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View className="flex-1 bg-darkPurple justify-center items-center px-4 md:px-8">
      <TopWave />
      <View className="items-center">
        <View className="rounded-full p-4 ">
          <Image
            source={require("../../assets/images/splash-icon.png")}
            className="w-56 h-56 md:w-64 md:h-64"
            resizeMode="contain"
          />
        </View>
      </View>

      <Text className="text-5xl md:text-7xl font-extrabold text-white mb-4 tracking-tight text-center font-poppins-bold">
        VYMIX
      </Text>
      <Text className="text-2xl md:text-3xl text-gray-300 mb-16 md:mb-20 text-center font-medium px-4 font-poppins">
        Your vibe. Your mix.
      </Text>

      {error && (
        <View className="w-full mb-4 bg-red-100 p-4 rounded-xl mx-4">
          <Text className="text-red-600 text-center font-poppins">{error}</Text>
        </View>
      )}

      <TouchableOpacity
        onPress={() => promptAsync()}
        disabled={!request || loading}
        className="w-full mb-4 px-4"
      >
        <View className="bg-white rounded-2xl py-4 md:py-5 px-6 shadow-lg flex-row items-center justify-center">
          {loading ? (
            <ActivityIndicator color="#211c84" />
          ) : (
            <>
              <Image
                source={require("../../assets/images/google-icon.png")}
                className="w-6 h-6 md:w-7 md:h-7 mr-3 md:mr-4"
              />
              <Text className="text-gray-800 text-center font-medium text-lg md:text-xl font-poppins">
                Continue with Google
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onAppleButtonPress}
        disabled={loading}
        className="w-full mb-4 px-4"
      >
        <View className="bg-black rounded-2xl py-4 md:py-5 px-6 shadow-lg flex-row items-center justify-center">
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Image
                source={require("../../assets/images/apple-icon.png")}
                className="w-6 h-6 md:w-7 md:h-7 mr-3 md:mr-4"
              />
              <Text className="text-white text-center font-medium text-lg md:text-xl font-poppins">
                Continue with Apple
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleGuestLogin}
        disabled={loading}
        className="w-full px-4"
      >
        <View className="bg-transparent border-2 border-white/20 rounded-2xl py-4 md:py-5 px-6">
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-center font-medium text-lg md:text-xl font-poppins">
              Continue as Guest
            </Text>
          )}

        </View>

      </TouchableOpacity>
      <BottomWave />
    </View>
  );
}
