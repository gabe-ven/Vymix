import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function CreateScreen() {
  return (
    <View className="bg-darkPurple flex-1">
      <View className="flex-1 justify-center items-center px-8">
        <Text className="text-3xl font-bold text-white mb-8">
          How are you feeling?
        </Text>
        
        {/* Mood selection buttons */}
        <View className="w-full space-y-4">
          <TouchableOpacity className="bg-[#1a1a1a] rounded-xl py-4 px-6">
            <Text className="text-white text-center font-semibold text-lg">
              Happy 😊
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="bg-[#1a1a1a] rounded-xl py-4 px-6">
            <Text className="text-white text-center font-semibold text-lg">
              Neutral 😐
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="bg-[#1a1a1a] rounded-xl py-4 px-6">
            <Text className="text-white text-center font-semibold text-lg">
              Sad 😢
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
