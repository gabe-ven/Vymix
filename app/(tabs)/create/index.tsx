import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VibeInput } from '@/app/components/VibeInput';
import { useRouter, useFocusEffect } from 'expo-router';

export default function CreateScreen() {
  const [inputValue, setInputValue] = useState('');
  const router = useRouter();

  useEffect(() => {
    const clearVibeText = async () => {
      try {
        await AsyncStorage.removeItem('currentVibe');
      } catch (error) {
        console.error('Error clearing vibe:', error);
      }
    };
    
    clearVibeText();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setInputValue('');
    }, [])
  );

  const handleInputChange = (text: string) => {
    setInputValue(text);
  };

  const handleNext = async () => {
    if (inputValue.trim()) {
      try {
        await AsyncStorage.setItem('currentVibe', inputValue);
        router.push('/(tabs)/create/emoji');
      } catch (error) {
        console.error('Error saving vibe:', error);
      }
    }
  };

  return (
    <View className="bg-darkPurple flex-1">
      <View className="w-full h-full p-4 flex items-center justify-center">
        <VibeInput 
          value={inputValue} 
          onChangeText={handleInputChange}
          onNext={handleNext}
        />
      </View>
    </View>
  );
}
