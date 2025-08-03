import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Image, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  Easing
} from 'react-native-reanimated';
import { COLORS } from '../constants/colors';
import { PlaylistData } from '../../services/playlistService';
import SongList from './SongList';
import AnimatedButton from './AnimatedButton';

interface PlaylistModalProps {
  visible: boolean;
  playlist: PlaylistData | null;
  onClose: () => void;
  onDelete?: () => void;
}

export default function PlaylistModal({ visible, playlist, onClose, onDelete }: PlaylistModalProps) {
  // Animation values - always start from initial state
  const coverOpacity = useSharedValue(0);
  const coverScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const descriptionOpacity = useSharedValue(0);
  const descriptionTranslateY = useSharedValue(20);
  const emojisOpacity = useSharedValue(0);
  const emojisScale = useSharedValue(0.8);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(20);
  const songsOpacity = useSharedValue(0);
  const songsTranslateY = useSharedValue(20);

  // Animated styles - always defined
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

  const emojisAnimatedStyle = useAnimatedStyle(() => ({
    opacity: emojisOpacity.value,
    transform: [{ scale: emojisScale.value }],
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  const songsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: songsOpacity.value,
    transform: [{ translateY: songsTranslateY.value }],
  }));

  // Animation logic in separate useEffect
  useEffect(() => {
    if (visible && playlist) {
      // Reset to initial state
      coverOpacity.value = 0;
      coverScale.value = 0.8;
      titleOpacity.value = 0;
      titleTranslateY.value = 20;
      descriptionOpacity.value = 0;
      descriptionTranslateY.value = 20;
      emojisOpacity.value = 0;
      emojisScale.value = 0.8;
      buttonsOpacity.value = 0;
      buttonsTranslateY.value = 20;
      songsOpacity.value = 0;
      songsTranslateY.value = 20;

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
      descriptionOpacity.value = withDelay(500, withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      }));
      
      descriptionTranslateY.value = withDelay(500, withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      }));

      // Animate emojis with delay
      emojisOpacity.value = withDelay(600, withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      }));
      
      emojisScale.value = withDelay(600, withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      }));

      // Animate buttons with delay
      buttonsOpacity.value = withDelay(700, withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      }));
      
      buttonsTranslateY.value = withDelay(700, withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      }));

      // Animate songs with delay
      songsOpacity.value = withDelay(800, withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      }));
      
      songsTranslateY.value = withDelay(800, withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      }));
    }
  }, [visible, playlist]);

  if (!playlist) return null;

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

  const formatTracksForDisplay = () => {
    if (!playlist.tracks) return [];
    
    return playlist.tracks.map((track) => {
      const albumImageUrl = track.album?.images?.[track.album.images.length - 1]?.url || undefined;
      
      return {
        title: track.name,
        artist: track.artists?.map((artist: { name: string }) => artist.name).join(', ') || 'Unknown Artist',
        album: track.album?.name || 'Unknown Album',
        duration: track.duration_ms || 0,
        spotifyUrl: track.external_urls?.spotify || '',
        albumImageUrl: albumImageUrl,
      };
    });
  };

  const handleOpenInSpotify = async () => {
    if (playlist.spotifyUrl) {
      try {
        const supported = await Linking.canOpenURL(playlist.spotifyUrl);
        if (supported) {
          await Linking.openURL(playlist.spotifyUrl);
        } else {
          Alert.alert(
            'Spotify Not Available',
            'Please install Spotify to open this playlist.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        Alert.alert(
          'Error',
          'Failed to open Spotify. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 pt-12">
          <TouchableOpacity onPress={onClose} className="p-2">
            <Text className="text-white text-lg font-poppins-bold">✕</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-poppins-bold">Playlist Details</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1">
          {/* Cover Image or Gradient */}
          <Animated.View className="relative h-64 mx-4 mb-6 rounded-2xl overflow-hidden" style={coverAnimatedStyle}>
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
            
            {/* Overlay with playlist info */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              className="absolute bottom-0 left-0 right-0 h-24"
            />
            
            {/* Playlist info */}
            <View className="absolute bottom-0 left-0 right-0 p-4">
              <Animated.Text 
                className="text-white text-2xl font-poppins-bold mb-1" 
                numberOfLines={1}
                style={titleAnimatedStyle}
              >
                {playlist.name}
              </Animated.Text>
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
          </Animated.View>

          {/* Description */}
          {playlist.description && (
            <Animated.View className="px-4 mb-6" style={descriptionAnimatedStyle}>
              <Text className="text-white text-base font-poppins opacity-80 leading-6">
                {playlist.description}
              </Text>
            </Animated.View>
          )}

          {/* Emojis */}
          <Animated.View className="px-4 mb-6" style={emojisAnimatedStyle}>
            <View className="flex-row">
              {playlist.emojis.map((emoji, index) => (
                <Text key={index} className="text-2xl mr-2">
                  {emoji}
                </Text>
              ))}
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View className="px-4 mb-6" style={buttonsAnimatedStyle}>
            <View className="flex-row justify-between gap-3">
              {playlist.spotifyUrl && (
                <AnimatedButton
                  title="Open in Spotify"
                  onPress={handleOpenInSpotify}
                  shouldAnimate={true}
                />
              )}
              
              {onDelete && (
                <AnimatedButton
                  title="Delete"
                  onPress={onDelete}
                  shouldAnimate={true}
                />
              )}
            </View>
          </Animated.View>

          {/* Songs List */}
          <Animated.View className="px-4 pb-8" style={songsAnimatedStyle}>
            <Text className="text-white text-lg font-poppins-bold mb-4">Songs</Text>
            <SongList 
              songs={formatTracksForDisplay()} 
              showScrollView={false}
              shouldAnimate={true}
            />
          </Animated.View>
        </ScrollView>
      </View>
    </Modal>
  );
} 