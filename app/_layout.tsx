import { View, Text } from "react-native";
import "./globals.css";
import { Stack, Redirect } from "expo-router";
import { AuthProvider } from './context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from './hooks/useFonts';

const _layout = () => {
  const { fontsLoaded, fontError } = useFonts();

  if (!fontsLoaded && !fontError) {
    return (
      <View className="flex-1 justify-center items-center bg-purple">
        <Text className="text-white text-lg font-poppins">Loading...</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="(auth)"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />
        </Stack>
      </SafeAreaProvider>
    </AuthProvider>
  );
};

export default _layout;
