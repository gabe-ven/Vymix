import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EmojiSelection from '../../components/EmojiSelection';

const emoji = () => {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleNextEmojis = async (selectedEmojis: string[]) => {
    try {
      await AsyncStorage.setItem('selectedEmojis', JSON.stringify(selectedEmojis));
      router.push('/(tabs)/create/playlist');
    } catch (error) {
      console.error('Error saving emojis:', error);
    }
  };

  return (
    <View className="flex-1 bg-darkPurple">
      <TouchableOpacity
        onPress={handleBack}
        className="absolute top-12 left-4 z-10 p-2"
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      
      <View className="w-full h-full pt-20">
        <EmojiSelection onNext={handleNextEmojis} />
      </View>
    </View>
  )
}

export default emoji