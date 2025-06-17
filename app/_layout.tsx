import { View, Text } from "react-native";
import "./globals.css";
import { Stack, Redirect } from "expo-router";
import { AuthProvider } from './context/AuthContext';

const _layout = () => {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
};

export default _layout;
