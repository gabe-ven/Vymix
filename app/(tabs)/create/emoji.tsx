import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react'

const emoji = () => {
  const router = useRouter();
  const [vibeText, setVibeText] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      const getVibeText = async () => {
        try {
          const vibe = await AsyncStorage.getItem('currentVibe');
          if (vibe) {
            setVibeText(vibe);
          }
        } catch (error) {
          console.error('Error retrieving vibe:', error);
        }
      };

      getVibeText();
    }, [])
  );

  const handleBack = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-darkPurple">
      <TouchableOpacity
        onPress={handleBack}
        className="absolute top-12 left-4 z-10 p-2"
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      
      <View className="w-full h-full p-4 flex items-center justify-center">
        <Text className="text-white font-poppins text-xl mb-4">Select an emoji</Text>
        <Text className="text-white font-poppins text-lg mb-8">Your vibe: {vibeText}</Text>
        <Text className="text-white font-poppins">Emoji selection coming soon...</Text>
      </View>
    </View>
  )
}

export default emoji