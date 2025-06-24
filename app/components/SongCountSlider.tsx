import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';

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
      <View className="bg-[#151623] rounded-2xl p-8 mb-8 min-h-[120px] justify-center">
        <Text className="text-5xl font-bold text-center text-white mb-4 font-poppins-bold leading-tight">
          {songCount}
        </Text>
        <Text className="text-lg text-gray-400 text-center font-poppins">
          songs in your playlist
        </Text>
      </View>
      
      <View className="w-full px-4">
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={5}
          maximumValue={50}
          value={songCount}
          onValueChange={handleValueChange}
          step={1}
          minimumTrackTintColor="#FF8C00"
          maximumTrackTintColor="#686a73"
          thumbTintColor="#FF8C00"
          tapToSeek={true}
        />
        
        <View className="flex-row justify-between mt-2">
          <Text className="text-gray-400 font-poppins">5</Text>
          <Text className="text-gray-400 font-poppins">50</Text>
        </View>
      </View>
    </View>
  );
} 