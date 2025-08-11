import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  Easing,
  interpolate,
  Extrapolate,
  SharedValue
} from 'react-native-reanimated';
import { COLORS } from '../constants/colors';
import Glass from './Glass';

interface PlaylistCardProps {
  name: string;
  description: string;
  songCount?: number;
  isSelected?: boolean;
  coverImageUrl?: string;
  shouldAnimate?: boolean;
  scrollY?: SharedValue<number>;
  tracks?: any[]; // Add tracks prop for fallback album covers
  compact?: boolean; // Add compact mode for modal usage
}

export default function PlaylistCard({ 
  name, 
  description, 
  songCount,
  isSelected = false,
  coverImageUrl,
  shouldAnimate = false,
  scrollY,
  tracks = [],
  compact = false
}: PlaylistCardProps) {
  // Animation values - always start from initial state
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const coverScale = useSharedValue(0.8);
  const coverOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const descriptionOpacity = useSharedValue(0);
  const descriptionTranslateY = useSharedValue(20);

  useEffect(() => {
    if (shouldAnimate) {
      // Animate card container
      cardOpacity.value = withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      });
      
      cardTranslateY.value = withTiming(0, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      });

      // Animate cover image with delay
      coverOpacity.value = withDelay(200, withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      }));
      
      coverScale.value = withDelay(200, withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      }));

      // Animate title with delay
      titleOpacity.value = withDelay(400, withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      }));
      
      titleTranslateY.value = withDelay(400, withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      }));

      // Animate description with delay
      descriptionOpacity.value = withDelay(600, withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      }));
      
      descriptionTranslateY.value = withDelay(600, withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      }));
    }
  }, [shouldAnimate]);

  // Scroll-based animated styles
  const cardScrollAnimatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    
    const translateY = interpolate(
      scrollY.value,
      [0, 300],
      [0, -50],
      Extrapolate.CLAMP
    );
    
    const scale = interpolate(
      scrollY.value,
      [0, 300],
      [1, 0.95],
      Extrapolate.CLAMP
    );
    
    const opacity = interpolate(
      scrollY.value,
      [0, 200, 400],
      [1, 0.9, 0.8],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateY },
        { scale }
      ],
      opacity,
    };
  });

  const coverScrollAnimatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    
    const scale = interpolate(
      scrollY.value,
      [0, 200],
      [1, 0.9],
      Extrapolate.CLAMP
    );
    
    const translateY = interpolate(
      scrollY.value,
      [0, 200],
      [0, -20],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { scale },
        { translateY }
      ],
    };
  });

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const coverAnimatedStyle = useAnimatedStyle(() => ({
    opacity: coverOpacity.value,
    transform: [{ scale: coverScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const descriptionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: descriptionOpacity.value,
    transform: [{ translateY: descriptionTranslateY.value }],
  }));

  // Get first 4 tracks for fallback album covers
  const firstFourTracks = tracks.slice(0, 4);

  // Render fallback album covers grid
  const renderAlbumCoversGrid = () => {
    if (firstFourTracks.length === 0) return null;

    return (
      <View className="w-full h-full rounded-lg overflow-hidden">
        <View className="flex-1 flex-row">
          {/* Top row */}
          <View className="flex-1 flex-col">
            <View className="flex-1">
              <Image 
                source={{ uri: firstFourTracks[0]?.album?.images?.[0]?.url }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
            <View className="flex-1">
              <Image 
                source={{ uri: firstFourTracks[1]?.album?.images?.[0]?.url }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          </View>
          {/* Bottom row */}
          <View className="flex-1 flex-col">
            <View className="flex-1">
              <Image 
                source={{ uri: firstFourTracks[2]?.album?.images?.[0]?.url }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
            <View className="flex-1">
              <Image 
                source={{ uri: firstFourTracks[3]?.album?.images?.[0]?.url }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Animated.View 
      className={compact ? "" : "mt-12"} 
      style={[
        cardAnimatedStyle,
        cardScrollAnimatedStyle
      ]}
    >
      <Glass 
        className={compact ? "w-full p-3" : "w-full p-4"}
        borderRadius={compact ? 12 : 16}
        blurAmount={25}
        backgroundColor={COLORS.transparent.white[10]}
      >
        <View className="items-center">
          {/* Playlist Cover */}
          <Animated.View 
            className={compact ? "w-48 h-48 mb-4 rounded-lg" : "w-64 h-64 mb-6 rounded-xl"}
            style={[
              coverAnimatedStyle,
              coverScrollAnimatedStyle,
              {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.4,
                shadowRadius: 20,
                elevation: 15,
              }
            ]}
          >
            <Glass 
              className="w-full h-full"
              borderRadius={12}
              blurAmount={25}
              backgroundColor={COLORS.transparent.white[10]}
            >
              <View className="flex-1 items-center justify-center">
                {coverImageUrl ? (
                  <Image 
                    source={{ uri: coverImageUrl }}
                    className="w-full h-full rounded-lg"
                    resizeMode="cover"
                  />
                ) : (
                  renderAlbumCoversGrid()
                )}
              </View>
            </Glass>
          </Animated.View>
          
          {/* Title */}
          <Animated.Text 
            className={compact ? "text-2xl font-bold text-ui-white font-poppins-bold mb-2 text-center leading-tight" : "text-3xl font-bold text-ui-white font-poppins-bold mb-2 text-center leading-tight"} 
            numberOfLines={compact ? 1 : 2}
            style={titleAnimatedStyle}
          >
            {name}
          </Animated.Text>
          
          {/* Description */}
          <Animated.Text 
            className={compact ? "text-sm text-ui-gray-light font-poppins-bold text-center leading-relaxed px-2" : "text-base text-ui-gray-light font-poppins-bold text-center leading-relaxed px-4"} 
            numberOfLines={compact ? 2 : 3}
            style={descriptionAnimatedStyle}
          >
            {description}
          </Animated.Text>
          
        </View>
      </Glass>
    </Animated.View>
  );
} 