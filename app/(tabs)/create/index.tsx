import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { VibeInput } from '@/app/components/VibeInput';

export default function CreateScreen() {
  return (
    <View className="bg-darkPurple flex-1">
      <View className="w-full h-full p-4 flex items-center justify-center">
        <VibeInput value="" onChangeText={() => {}} />
      </View>
    </View>
  );
}
