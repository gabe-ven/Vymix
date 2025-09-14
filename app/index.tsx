import { Redirect } from 'expo-router';
import { useAuth } from './context/AuthContext';
import { View, Text } from 'react-native';

export default function Index() {
  const { user, loading: authLoading } = useAuth();

  // Show loading while checking authentication status
  if (authLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-purple">
        <Text className="text-white text-lg font-poppins">Loading...</Text>
      </View>
    );
  }

  // If user is not authenticated, go to login
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // If user is authenticated, go to main app
  return <Redirect href="/(tabs)/create" />;
}
