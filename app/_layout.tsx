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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#211C84' }}>
        <Text style={{ color: 'white', fontSize: 18 }} className="font-poppins">Loading...</Text>
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
