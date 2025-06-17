import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { FontAwesome } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        await auth().signOut();
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <View className="bg-darkPurple flex-1 p-6 pb-24">
      {/* Profile Header */}
      <View className="items-center mt-12 mb-8">
        <View className="w-24 h-24 bg-[#1a1a1a] rounded-full items-center justify-center mb-4 overflow-hidden">
          {user?.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <FontAwesome name="user" size={40} color="#666666" />
          )}
        </View>
        <Text className="text-2xl font-bold text-white mb-2">
          {user?.displayName || user?.email?.split('@')[0] || 'User'}
        </Text>
        <Text className="text-gray-400">
          {user?.email || 'Guest User'}
        </Text>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={handleSignOut}
        className="bg-red-500 rounded-xl py-4 px-6"
      >
        <Text className="text-white text-center font-semibold text-lg">
          Sign Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}
 