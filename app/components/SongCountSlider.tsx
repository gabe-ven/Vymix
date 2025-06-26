import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { COLORS } from '../constants/colors';
import Glass from './Glass';

interface SongCountSliderProps {
  onValueChange: (value: number) => void;
  initialValue?: number;
}

export default function SongCountSlider({ onValueChange, initialValue = 10 }: SongCountSliderProps) {
  const [songCount, setSongCount] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue.toString());

  const handleValueChange = (value: number) => {
    setSongCount(value);
    setInputValue(value.toString());
    onValueChange(value);
  };

  const handleCirclePress = () => {
    setIsEditing(true);
    setInputValue(songCount.toString());
  };

  const handleInputSubmit = () => {
    const newValue = parseInt(inputValue, 10);
    if (!isNaN(newValue)) {
      const clampedValue = Math.max(5, Math.min(100, newValue));
      setSongCount(clampedValue);
      setInputValue(clampedValue.toString());
      onValueChange(clampedValue);
    } else {
      setInputValue(songCount.toString());
    }
    setIsEditing(false);
  };

  const handleInputBlur = () => {
    handleInputSubmit();
  };

  return (
    <View className="w-full max-w-md">
      <View className="items-center mb-8">
        <TouchableOpacity onPress={handleCirclePress} activeOpacity={0.8}>
          <Glass 
            className="w-32 h-32 items-center justify-center"
            borderRadius={64}
            blurAmount={30}
          >
            <TextInput
              value={isEditing ? inputValue : songCount.toString()}
              onChangeText={isEditing ? setInputValue : undefined}
              onSubmitEditing={handleInputSubmit}
              onBlur={handleInputBlur}
              onPressIn={handleCirclePress}
              editable={isEditing}
              keyboardType="numeric"
              maxLength={3}
              className="text-5xl font-bold text-center text-ui-white font-poppins-bold leading-tight"
              style={{ 
                color: COLORS.ui.white,
                textAlign: 'center',
                textAlignVertical: 'center',
                padding: 0,
                margin: 0,
                marginTop: 15,
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              selectTextOnFocus={isEditing}
            />
          </Glass>
        </TouchableOpacity>
      </View>
      
      <View className="w-full px-4">
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={10}
          maximumValue={100}
          value={songCount}
          onValueChange={handleValueChange}
          step={1}
          minimumTrackTintColor={COLORS.primary.orange}
          maximumTrackTintColor={COLORS.ui.gray.medium}
          thumbTintColor={COLORS.primary.orange}
          tapToSeek={true}
        />
        
        <View className="flex-row justify-between mt-2">
          <Text className="text-xl font-bold text-ui-gray-light font-poppins-bold">10</Text>
          <Text className="text-xl font-bold text-ui-gray-light font-poppins-bold">100</Text>
        </View>
      </View>
    </View>
  );
} 