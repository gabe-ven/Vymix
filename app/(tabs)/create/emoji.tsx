import { View, TouchableOpacity } from 'react-native';
import { Layout } from '@/app/components/Layout';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EmojiSelection from '../../components/EmojiSelection';
import { COLORS } from '../../constants/colors';

const emoji = () => {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleNextEmojis = async (selectedEmojis: string[]) => {
    try {
      await AsyncStorage.setItem(
        'selectedEmojis',
        JSON.stringify(selectedEmojis)
      );
      router.push('/(tabs)/create/amount');
    } catch (error) {
      console.error('Error saving emojis:', error);
    }
  };

  return (
    <Layout>
      <TouchableOpacity
        onPress={handleBack}
        className="absolute top-12 left-4 z-10 p-2"
      >
        <Ionicons name="chevron-back" size={28} color={COLORS.ui.white} />
      </TouchableOpacity>

      <View className="w-full h-full pt-20">
        <EmojiSelection onNext={handleNextEmojis} />
      </View>
    </Layout>
  );
};

export default emoji;
