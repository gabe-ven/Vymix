import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/colors';
import { PlaylistData } from '../../services/playlistService';

interface MixCardProps {
  playlist: PlaylistData;
  onPress?: () => void;
  onDelete?: () => void;
}

export default function MixCard({ playlist, onPress, onDelete }: MixCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Navigate to playlist details
      router.push({
        pathname: '/(tabs)/create/playlist',
        params: { playlistId: playlist.id }
      });
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
      className="mb-4 rounded-2xl overflow-hidden"
      activeOpacity={0.8}
    >
      <View className="relative">
        {/* Cover Image or Gradient Background */}
        {playlist.coverImageUrl ? (
          <Image 
            source={{ uri: playlist.coverImageUrl }}
            className="w-full h-48"
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={getGradientColors()}
            className="w-full h-48"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        
        {/* Overlay with playlist info */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          className="absolute bottom-0 left-0 right-0 h-24"
        />
        
        {/* Playlist info */}
        <View className="absolute bottom-0 left-0 right-0 p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-white text-lg font-poppins-bold mb-1" numberOfLines={1}>
                {playlist.name}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-white text-sm font-poppins mr-3 opacity-80">
                  {playlist.songCount} {playlist.songCount === 1 ? 'song' : 'songs'}
                </Text>
                {playlist.createdAt && (
                  <Text className="text-white text-sm font-poppins opacity-70">
                    {formatDate(playlist.createdAt)}
                  </Text>
                )}
              </View>
            </View>
            
            {/* Emojis */}
            <View className="flex-row ml-2">
              {playlist.emojis.slice(0, 3).map((emoji, index) => (
                <Text key={index} className="text-xl mr-1">
                  {emoji}
                </Text>
              ))}
            </View>
          </View>
        </View>
        
        {/* Delete button */}
        {onDelete && (
          <TouchableOpacity
            onPress={onDelete}
            className="absolute top-3 right-3 bg-black bg-opacity-60 rounded-xl w-9 h-9 items-center justify-center"
            activeOpacity={0.7}
          >
            <Text className="text-white text-base font-poppins-bold">🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
} 