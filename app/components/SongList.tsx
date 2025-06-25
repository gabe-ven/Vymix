import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { COLORS } from '../constants/colors';
import Glass from './Glass';

interface Song {
  title: string;
  artist: string;
}

interface SongListProps {
  songs: Song[];
  title?: string;
  maxHeight?: number;
  showScrollView?: boolean;
}

export default function SongList({ 
  songs, 
  title,
  maxHeight,
  showScrollView = true
}: SongListProps) {
  const SongItems = () => (
    <>
      {songs.map((song, index) => (
        <Glass 
          key={index}
          className="mb-3 p-4"
          borderRadius={12}
          blurAmount={15}
          backgroundColor={COLORS.transparent.white[5]}
        >
          <View className="flex-row items-center">
            {/* Album Cover Placeholder */}
            <View 
              className="w-14 h-14 rounded-lg mr-4 items-center justify-center"
              style={{ backgroundColor: COLORS.transparent.white[10] }}
            >
              <Text className="text-xl">🎵</Text>
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
      ))}
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