import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { COLORS } from '../constants/colors';
import { SONG_ANIMATION } from '../constants/animations';
import Glass from './Glass';
import Animated, { 
  useAnimatedStyle, 
  interpolate, 
  Extrapolate,
  SharedValue
} from 'react-native-reanimated';

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
  scrollY?: SharedValue<number>;
}

export default function SongList({ 
  songs, 
  title,
  maxHeight,
  showScrollView = true,
  scrollY
}: SongListProps) {
  const SongItems = () => (
    <>
      {songs.map((song, index) => {
        const songStartFade = SONG_ANIMATION.START_FADE + (index * SONG_ANIMATION.FADE_SPACING);
        const songEndFade = songStartFade + SONG_ANIMATION.FADE_DURATION;
        
        const songAnimatedStyle = useAnimatedStyle(() => {
          if (!scrollY) return { opacity: 1, transform: [{ scale: 1 }] };
          
          const opacity = interpolate(
            scrollY.value,
            [songStartFade, songEndFade],
            [1, 0],
            Extrapolate.CLAMP
          );

          const scale = interpolate(
            scrollY.value,
            [songStartFade, songEndFade],
            [1, SONG_ANIMATION.SCALE_DOWN],
            Extrapolate.CLAMP
          );

          return {
            opacity,
            transform: [{ scale }]
          };
        });

        return (
          <Animated.View
            key={index}
            style={songAnimatedStyle}
          >
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
      })}
    </>
  );

  if (showScrollView && maxHeight) {
    return (
      <View className="w-full">
        {title && (
          <Text className="text-xl font-bold text-ui-white font-poppins-bold mb-4 text-center">
            {title}
          </Text>
        )}
        <ScrollView 
          className={`max-h-${maxHeight}`}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          <SongItems />
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="w-full">
      {title && (
        <Text className="text-xl font-bold text-ui-white font-poppins-bold mb-4 text-center">
          {title}
        </Text>
      )}
      <SongItems />
    </View>
  );
} 