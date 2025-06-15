import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function CreateScreen() {
  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-8">
        <Text className="text-3xl font-bold text-gray-900 mb-8">
          How are you feeling?
        </Text>
        
        {/* Mood selection buttons */}
        <View className="w-full space-y-4">
          <TouchableOpacity className="bg-blue-500 rounded-xl py-4 px-6">
            <Text className="text-white text-center font-semibold text-lg">
              Happy 😊
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="bg-gray-500 rounded-xl py-4 px-6">
            <Text className="text-white text-center font-semibold text-lg">
              Neutral 😐
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="bg-red-500 rounded-xl py-4 px-6">
            <Text className="text-white text-center font-semibold text-lg">
              Sad 😢
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
