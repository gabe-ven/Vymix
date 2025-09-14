import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  COLORS,
  getGradientByMood,
  getRandomGradient,
} from '../constants/colors';
import { PlaylistData } from '../../services/playlistService';
import Glass from './Glass';
import { Ionicons } from '@expo/vector-icons';

interface MixCardProps {
  playlist: PlaylistData;
  onPress?: () => void;
}

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

export default function MixCard({ playlist, onPress }: MixCardProps) {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.15);
  const shadowRadius = useSharedValue(8);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 150 });
    shadowOpacity.value = withTiming(0.25, { duration: 150 });
    shadowRadius.value = withTiming(12, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    shadowOpacity.value = withTiming(0.15, { duration: 150 });
    shadowRadius.value = withTiming(8, { duration: 150 });
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: shadowOpacity.value,
    shadowRadius: shadowRadius.value,
  }));

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
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getGradientColors = () => {
    if (playlist.colorPalette && playlist.colorPalette.length >= 2) {
      return [playlist.colorPalette[0], playlist.colorPalette[1]] as const;
    }

    // Try to get gradient based on playlist name/description mood
    const playlistText =
      `${playlist.name} ${playlist.description || ''}`.toLowerCase();
    const moodGradient = getGradientByMood(playlistText);

    // If mood detection didn't work, use consistent hash-based selection
    if (moodGradient === COLORS.musicGradients.electronic) {
      const hash = playlist.name.split('').reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);

      const gradientKeys = Object.keys(COLORS.musicGradients);
      const index = Math.abs(hash) % gradientKeys.length;
      const selectedKey = gradientKeys[
        index
      ] as keyof typeof COLORS.musicGradients;
      return COLORS.musicGradients[selectedKey];
    }

    return moodGradient;
  };

  return (
    <AnimatedTouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="mb-6"
      style={[
        animatedStyle,
        {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        },
      ]}
    >
      <Glass
        className="p-6"
        blurAmount={30}
        borderRadius={24}
        backgroundColor={COLORS.transparent.white[10]}
        variant="card"
      >
        <View className="flex-row items-center">
          {/* Playlist Cover Square with enhanced styling */}
          <View className="relative">
            <View className="w-24 h-24 rounded-3xl overflow-hidden mr-5">
              {playlist.coverImageUrl ? (
                <Image
                  source={{ uri: playlist.coverImageUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={getGradientColors()}
                  className="w-full h-full items-center justify-center"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons
                    name="musical-notes"
                    size={28}
                    color="rgba(255, 255, 255, 0.9)"
                  />
                </LinearGradient>
              )}
            </View>

            {/* Floating play indicator */}
            <View className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-lime-400 items-center justify-center">
              <Ionicons
                name="play"
                size={14}
                color="#000000"
                style={{ marginLeft: 1 }}
              />
            </View>
          </View>

          {/* Playlist Info with better typography */}
          <View className="flex-1">
            <Text
              className="text-white text-xl font-poppins-bold mb-3 leading-tight"
              numberOfLines={1}
            >
              {playlist.name}
            </Text>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="flex-row items-center bg-white/10 rounded-full px-3 py-1.5 mr-3">
                  <Ionicons
                    name="musical-note"
                    size={12}
                    color={COLORS.primary.lime}
                    style={{ marginRight: 4 }}
                  />
                  <Text className="text-white text-xs font-poppins-bold">
                    {playlist.songCount}{' '}
                    {playlist.songCount === 1 ? 'song' : 'songs'}
                  </Text>
                </View>

                {playlist.createdAt && (
                  <View className="flex-row items-center bg-white/5 rounded-full px-3 py-1.5">
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color="rgba(255, 255, 255, 0.6)"
                      style={{ marginRight: 4 }}
                    />
                    <Text className="text-white/60 text-xs font-poppins">
                      {formatDate(playlist.createdAt)}
                    </Text>
                  </View>
                )}
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="rgba(255, 255, 255, 0.4)"
              />
            </View>
          </View>
        </View>
      </Glass>
    </AnimatedTouchableOpacity>
  );
}
