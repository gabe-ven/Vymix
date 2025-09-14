import { View, Text } from 'react-native';
import './globals.css';
import { Stack, Redirect } from 'expo-router';
import { AuthProvider } from './context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from './hooks/useFonts';
import Toast from 'react-native-toast-message';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://93be571eefc4ae10c86693914163d869@o4510019982131200.ingest.us.sentry.io/4510019982327808',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

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
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <Toast />
      </SafeAreaProvider>
    </AuthProvider>
  );
};

export default Sentry.wrap(_layout);