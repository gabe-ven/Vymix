import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Layout } from '@/app/components/Layout';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SongCountSlider from '../../components/SongCountSlider';
import { COLORS } from '../../constants/colors';
import Glass from '../../components/Glass';

export default function Amount() {
  const [songCount, setSongCount] = useState(10);
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleNext = async () => {
    try {
      await AsyncStorage.setItem('songCount', songCount.toString());
      router.push('/(tabs)/create/playlist');
    } catch (error) {
      console.error('Error saving song count:', error);
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
      
      <View className="w-full h-full pt-20 px-4 flex items-center justify-center">
        <Text className="text-4xl md:text-5xl font-bold text-ui-white mb-8 text-center px-4 font-poppins-bold">
          How many songs?
        </Text>
        
        <SongCountSlider 
          onValueChange={setSongCount}
          initialValue={10}
        />
        
        <View className="mt-12">
          <Glass 
            className="rounded-full"
            blurAmount={20}
            backgroundColor={COLORS.transparent.white[10]}
          >
            <TouchableOpacity
              onPress={handleNext}
              className="rounded-full px-8 py-4 items-center justify-center"
            >
              <Text className="text-ui-white font-semibold text-xl font-poppins-bold">
                Create Playlist
              </Text>
            </TouchableOpacity>
          </Glass>
        </View>
      </View>
    </Layout>
  );
}