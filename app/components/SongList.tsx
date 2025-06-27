import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Image, FlatList } from 'react-native';
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

interface Song {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  spotifyUrl?: string;
  albumImageUrl?: string;
}

interface SongListProps {
  songs: Song[];
  title?: string;
  maxHeight?: number;
  showScrollView?: boolean;
  shouldAnimate?: boolean;
  scrollY?: SharedValue<number>;
  onScroll?: (scrollY: any) => void;
}

// Separate component for each song to avoid hook call issues
const SongItem = ({ 
  song, 
  index, 
  shouldAnimate, 
  animation, 
  scrollAnimation,
  scrollY
}: { 
  song: Song; 
  index: number; 
  shouldAnimate: boolean; 
  animation?: any; 
  scrollAnimation?: any;
  scrollY?: SharedValue<number>;
}) => {
  // Animation values for each song item
  const itemOpacity = useSharedValue(shouldAnimate ? 0 : 1);
  const itemTranslateX = useSharedValue(shouldAnimate ? -50 : 0);
  const itemScale = useSharedValue(shouldAnimate ? 0.95 : 1);

  useEffect(() => {
    if (shouldAnimate) {
      // Stagger the animations based on index
      const delay = 800 + (index * 100); // Start after playlist card animation
      
      itemOpacity.value = withDelay(delay, withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      }));
      
      itemTranslateX.value = withDelay(delay, withTiming(0, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      }));
      
      itemScale.value = withDelay(delay, withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      }));
    }
  }, [shouldAnimate, index]);

  // Scroll-based animated styles for each individual song item
  const itemScrollAnimatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    
    // Calculate the absolute position of this song on the phone screen
    // Each song is approximately 100px tall, and we need to account for the playlist card and buttons above
    const playlistCardHeight = 400; // Approximate height of playlist card
    const buttonsHeight = 100; // Approximate height of action buttons
    const songListOffset = playlistCardHeight + buttonsHeight;
    
    // Each song's position relative to the top of the phone screen
    const songScreenPosition = songListOffset + (index * 100);
    
    // Start sliding back when the song is 200px from the top of the screen
    const slideStartPosition = songScreenPosition - 200;
    const slideEndPosition = songScreenPosition - 50;
    
    // Song starts sliding back when it's 200px from the top of the phone screen
    const slideProgress = interpolate(
      scrollY.value,
      [slideStartPosition, slideEndPosition],
      [0, 1],
      Extrapolate.CLAMP
    );
    
    // Slide back (translateY) and get smaller, no left movement
    const translateY = interpolate(
      slideProgress,
      [0, 1],
      [0, -15],
      Extrapolate.CLAMP
    );
    
    const scale = interpolate(
      slideProgress,
      [0, 1],
      [1, 0.9],
      Extrapolate.CLAMP
    );
    
    const opacity = interpolate(
      slideProgress,
      [0, 1],
      [1, 0.6],
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

  const itemAnimatedStyle = useAnimatedStyle(() => ({
    opacity: itemOpacity.value,
    transform: [
      { translateX: itemTranslateX.value },
      { scale: itemScale.value }
    ],
  }));

  return (
    <Animated.View style={[
      itemAnimatedStyle,
      itemScrollAnimatedStyle
    ]}>
      <Glass 
        className="mb-6 p-4"
        borderRadius={12}
        blurAmount={15}
        backgroundColor={COLORS.transparent.white[5]}
      >
        <View className="flex-row items-center">
          {/* Album Cover */}
          <View 
            className="w-14 h-14 rounded-lg mr-4 overflow-hidden"
            style={{ backgroundColor: COLORS.transparent.white[10] }}
          >
            {song.albumImageUrl ? (
              <Image
                source={{ uri: song.albumImageUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Text className="text-xl">🎵</Text>
              </View>
            )}
          </View>
          
          {/* Song Info */}
          <View className="flex-1">
            <Text className="text-lg text-ui-white font-poppins-bold" numberOfLines={1}>
              {song.title}
            </Text>
            <Text className="text-sm text-ui-gray-light font-poppins-bold mt-1" numberOfLines={1}>
              {song.artist}
            </Text>
          </View>
        </View>
      </Glass>
    </Animated.View>
  );
};

export default function SongList({ 
  songs, 
  title,
  maxHeight,
  showScrollView = true,
  shouldAnimate = false,
  scrollY: externalScrollY,
  onScroll
}: SongListProps) {
  // Animation values for title
  const titleOpacity = useSharedValue(shouldAnimate ? 0 : 1);
  const titleTranslateY = useSharedValue(shouldAnimate ? 20 : 0);

  useEffect(() => {
    if (shouldAnimate && title) {
      // Animate title with delay
      titleOpacity.value = withDelay(700, withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      }));
      
      titleTranslateY.value = withDelay(700, withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      }));
    }
  }, [shouldAnimate, title]);

  // Scroll-based title animation
  const titleScrollAnimatedStyle = useAnimatedStyle(() => {
    if (!externalScrollY) return {};
    
    const translateY = interpolate(
      externalScrollY.value,
      [0, 200],
      [0, -20],
      Extrapolate.CLAMP
    );
    
    const opacity = interpolate(
      externalScrollY.value,
      [0, 150, 300],
      [1, 0.8, 0.6],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const renderSong = ({ item: song, index }: { item: Song; index: number }) => {
    return (
      <SongItem
        song={song}
        index={index}
        shouldAnimate={shouldAnimate}
        animation={undefined}
        scrollAnimation={undefined}
        scrollY={externalScrollY}
      />
    );
  };

  if (showScrollView && maxHeight) {
    return (
      <View className="w-full">
        {title && (
          <Animated.Text 
            className="text-xl font-bold text-ui-white font-poppins-bold mb-4 text-center"
            style={[
              titleAnimatedStyle,
              titleScrollAnimatedStyle
            ]}
          >
            {title}
          </Animated.Text>
        )}
        <ScrollView 
          className={`max-h-${maxHeight}`}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {songs.map((song, index) => (
            <SongItem
              key={index}
              song={song}
              index={index}
              shouldAnimate={shouldAnimate}
              animation={undefined}
              scrollAnimation={undefined}
              scrollY={externalScrollY}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  // Return a regular View container (no scroll animation on container)
  return (
    <View className="w-full">
      {title && (
        <Animated.Text 
          className="text-xl font-bold text-ui-white font-poppins-bold mb-4 text-center"
          style={[
            titleAnimatedStyle,
            titleScrollAnimatedStyle
          ]}
        >
          {title}
        </Animated.Text>
      )}
      {songs.map((song, index) => (
        <SongItem
          key={index}
          song={song}
          index={index}
          shouldAnimate={shouldAnimate}
          animation={undefined}
          scrollAnimation={undefined}
          scrollY={externalScrollY}
        />
      ))}
    </View>
  );
} 