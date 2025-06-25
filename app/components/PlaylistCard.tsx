import React from 'react';
import { View, Text, Image } from 'react-native';
import { COLORS } from '../constants/colors';
import Glass from './Glass';

interface PlaylistCardProps {
  name: string;
  description: string;
  songCount?: number;
  isSelected?: boolean;
  coverImageUrl?: string;
}

export default function PlaylistCard({ 
  name, 
  description, 
  songCount,
  isSelected = false,
  coverImageUrl
}: PlaylistCardProps) {
  return (
    <View>
      <Glass 
        className="w-full p-4"
        borderRadius={16}
        blurAmount={25}
        backgroundColor={COLORS.transparent.white[10]}
      >
        <View className="items-center">
          {/* Large Playlist Cover */}
          <View 
            className="w-64 h-64 mb-6"
            style={{
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 15,
            }}
          >
            <Glass 
              className="w-full h-full"
              borderRadius={12}
              blurAmount={25}
              backgroundColor={COLORS.transparent.white[10]}
            >
              <View className="flex-1 items-center justify-center">
                <Image 
                  source={coverImageUrl ? { uri: coverImageUrl } : require('../../assets/images/cover.png')}
                  className="w-full h-full rounded-lg"
                  resizeMode="cover"
                />
              </View>
            </Glass>
          </View>
          
          {/* Title */}
          <Text className="text-3xl font-bold text-ui-white font-poppins-bold mb-2 text-center leading-tight" numberOfLines={2}>
            {name}
          </Text>
          
          {/* Description */}
          <Text className="text-base text-ui-gray-light font-poppins-bold text-center leading-relaxed px-4" numberOfLines={3}>
            {description}
          </Text>
          
        </View>
      </Glass>
    </View>
  );
} 