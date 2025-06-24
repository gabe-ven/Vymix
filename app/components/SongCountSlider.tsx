import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { COLORS } from '../constants/colors';
import Glass from './Glass';

interface SongCountSliderProps {
  onValueChange: (value: number) => void;
  initialValue?: number;
}

export default function SongCountSlider({ onValueChange, initialValue = 10 }: SongCountSliderProps) {
  const [songCount, setSongCount] = useState(initialValue);

  const handleValueChange = (value: number) => {
    setSongCount(value);
    onValueChange(value);
  };

  return (
    <View className="w-full max-w-md">
      <View className="items-center mb-8">
        <Glass 
          className="w-32 h-32 items-center justify-center"
          borderRadius={64}
          blurAmount={30}
        >
          <Text className="text-5xl font-bold justify-center items-center text-center text-ui-white font-poppins-bold leading-tight">
            {songCount}
          </Text>
        </Glass>
      </View>
      
      <View className="w-full px-4">
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={5}
          maximumValue={50}
          value={songCount}
          onValueChange={handleValueChange}
          step={1}
          minimumTrackTintColor={COLORS.primary.orange}
          maximumTrackTintColor={COLORS.primary.yellow}
          thumbTintColor={COLORS.primary.orange}
          tapToSeek={true}
        />
        
        <View className="flex-row justify-between mt-2">
          <Text className="text-xl font-bold text-ui-gray-light font-poppins-bold">5</Text>
          <Text className="text-xl font-bold text-ui-gray-light font-poppins-bold">50</Text>
        </View>
      </View>
    </View>
  );
} 