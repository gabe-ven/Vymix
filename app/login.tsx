import React, { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../services/firebase";
import { GOOGLE_CLIENT_IDS } from "../env";
import { useRouter } from "expo-router";
import { signInAnonymously } from "firebase/auth";


WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_CLIENT_IDS.ios,
    webClientId: GOOGLE_CLIENT_IDS.web,
  });

  const [userLoggedIn, setUserLoggedIn] = useState(false);

  useEffect(() => {
    if (response?.type === "success") {
      const { idToken } =
        (response.authentication as { idToken?: string }) || {};
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        signInWithCredential(auth, credential)
          .then(() => {
            setUserLoggedIn(true);
            router.replace("/(tabs)/create");
          })
          .catch((err) => console.error("Firebase sign-in error:", err));
      }
    }
  }, [response]);

  const handleGuestLogin = async () => {
    try {
      const userCredential = await signInAnonymously(auth);
      if (userCredential.user) {
        setUserLoggedIn(true);
        router.replace("/(tabs)/create");
      }
    } catch (err) {
      console.error("Anonymous sign-in error:", err);
      // You might want to show an error message to the user here
      alert("Failed to sign in as guest. Please try again.");
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
            source={require("../assets/images/splash-icon.png")}
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

      {/* Google Login Button with Enhanced Styling */}
      <TouchableOpacity
        onPress={() => promptAsync()}
        disabled={!request}
        className="w-full mb-4"
      >
        <View className="bg-white rounded-2xl py-5 px-6 shadow-lg flex-row items-center justify-center">
          <Image
            source={require("../assets/images/google-icon.png")}
            className="w-7 h-7 mr-4"
          />
          <Text className="text-gray-800 text-center font-medium text-xl">
            Continue with Google
          </Text>
        </View>
      </TouchableOpacity>

      {/* Apple Login Button */}
      <TouchableOpacity
        onPress={() => promptAsync()}
        disabled={!request}
        className="w-full mb-4"
      >
        <View className="bg-black rounded-xl py-5 px-6 shadow-lg flex-row items-center justify-center">
          <Image
            source={require("../assets/images/apple-icon.png")}
            className="w-7 h-7 mr-4"
          />
          <Text className="text-white text-center font-medium text-xl">
            Continue with Apple
          </Text>
        </View>
      </TouchableOpacity>

      {/* Guest Login Button with Enhanced Styling */}
      <TouchableOpacity
        onPress={handleGuestLogin}
        className="w-full"
      >
        <View className="bg-transparent border-2 border-white/30 rounded-2xl py-5 px-6">
          <Text className="text-white text-center font-medium text-xl">
            Continue as Guest
          </Text>
        </View>
      </TouchableOpacity>

    </View>
  );
}
