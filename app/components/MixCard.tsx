import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { PlaylistData } from '../../services/playlistService';
import Glass from './Glass';

interface MixCardProps {
  playlist: PlaylistData;
  onPress?: () => void;
}

export default function MixCard({ playlist, onPress }: MixCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getGradientColors = () => {
    if (playlist.colorPalette && playlist.colorPalette.length >= 2) {
      return [playlist.colorPalette[0], playlist.colorPalette[1]] as const;
    }
    return [COLORS.primary.darkPurple, COLORS.primary.lime] as const;
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      className="mb-4"
      activeOpacity={0.9}
    >
      <Glass className="p-5" blurAmount={25} borderRadius={20}>
        <View className="flex-row items-center">
          {/* Playlist Cover Square */}
          <View className="w-20 h-20 rounded-2xl overflow-hidden mr-4">
            {playlist.coverImageUrl ? (
              <Image 
                source={{ uri: playlist.coverImageUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={getGradientColors()}
                className="w-full h-full"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
          </View>
          
          {/* Playlist Info */}
          <View className="flex-1">
            <Text className="text-white text-xl font-poppins-bold mb-2" numberOfLines={1}>
              {playlist.name}
            </Text>
            
            <View className="flex-row items-center">
              <Text className="text-white text-sm font-poppins-semibold mr-3">
                {playlist.songCount} {playlist.songCount === 1 ? 'song' : 'songs'}
              </Text>
              {playlist.createdAt && (
                <Text className="text-white text-sm font-poppins-semibold">
                  {formatDate(playlist.createdAt)}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Glass>
    </TouchableOpacity>
  );
} 