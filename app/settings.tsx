import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Layout } from '@/app/components/Layout';
import Glass from '@/app/components/Glass';
import { COLORS } from '@/app/constants/colors';
import { useAuth } from '@/app/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const handleClearCache = async () => {
    try {
      if (user?.uid) {
        await AsyncStorage.removeItem(`playlist_cache_${user.uid}`);
        await AsyncStorage.removeItem(`spotify_connected_${user.uid}`);
      }
      Alert.alert('Cleared', 'Local cache was cleared.');
    } catch (e) {
      Alert.alert('Error', 'Failed to clear cache.');
    }
  };

  return (
    <Layout>
      <View className="flex-1 p-6">
        {/* Header */}
        <View className="relative items-center justify-center mb-6 mt-10">
          <TouchableOpacity onPress={() => router.back()} className="absolute left-0 p-2">
            <Ionicons name="chevron-back" size={28} color={COLORS.ui.white} />
          </TouchableOpacity>
          <Text className="text-ui-white text-lg font-poppins-bold">Settings</Text>
        </View>

        <Glass className="rounded-xl p-4" blurAmount={20} backgroundColor={COLORS.transparent.white[10]}>
          <Text className="text-ui-white font-poppins mb-3">Maintenance</Text>
          <TouchableOpacity onPress={handleClearCache} className="bg-white/10 rounded-lg py-3 px-4">
            <Text className="text-ui-white font-poppins text-center">Clear cache / reset</Text>
          </TouchableOpacity>
        </Glass>
      </View>
    </Layout>
  );
}


