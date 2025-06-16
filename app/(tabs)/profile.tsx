import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { FontAwesome } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <View className="flex-1 bg-blue p-6">
      {/* Profile Header */}
      <View className="items-center mt-12 mb-8">
        <View className="w-24 h-24 bg-white/10 rounded-full items-center justify-center mb-4">
          <FontAwesome name="user" size={40} color="white" />
        </View>
        <Text className="text-2xl font-bold text-white mb-2">
          {user?.displayName || 'User'}
        </Text>
        <Text className="text-gray-300">
          {user?.email || 'Guest User'}
        </Text>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={signOut}
        className="bg-red-500 rounded-xl py-4 px-6 mt-auto mb-8"
      >
        <Text className="text-white text-center font-semibold text-lg">
          Sign Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}
