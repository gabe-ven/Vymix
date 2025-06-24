import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Layout } from '@/app/components/Layout';
import { useAuth } from '../context/AuthContext';
import { FontAwesome } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/colors';

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
    <Layout>
      <View className="flex-1 p-4 md:p-6 pb-24">
        {/* Profile Header */}
        <View className="items-center mt-12 md:mt-16 mb-6 md:mb-8">
          <View className="w-20 h-20 md:w-24 md:h-24 bg-background-darker rounded-full items-center justify-center mb-4 overflow-hidden">
            {user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <FontAwesome name="user" size={32} color={COLORS.ui.gray.dark} />
            )}
          </View>
          <Text className="text-xl md:text-2xl font-bold text-ui-white mb-2 text-center px-4 font-poppins-bold">
            {user?.displayName || user?.email?.split('@')[0] || 'User'}
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-red-500 rounded-xl py-3 md:py-4 px-6 mx-4"
        >
          <Text className="text-ui-white text-center font-semibold text-base md:text-lg font-poppins">
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </Layout>
  );
}
 