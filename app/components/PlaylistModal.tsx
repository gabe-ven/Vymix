import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  withSpring,
  Easing
} from 'react-native-reanimated';

import { PlaylistData } from '../../services/playlistService';
import SongList from './SongList';
import AnimatedButton from './AnimatedButton';
import PlaylistCard from './PlaylistCard';

interface PlaylistModalProps {
  visible: boolean;
  playlist: PlaylistData | null;
  onClose: () => void;
  onDelete?: () => void;
  onSave?: () => void;
}

export default function PlaylistModal({ visible, playlist, onClose, onDelete, onSave }: PlaylistModalProps) {
  const [shouldAnimateCard, setShouldAnimateCard] = useState(false);
  
  // Modal entrance animation only
  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.95);
  const modalTranslateY = useSharedValue(20);

  // Modal entrance animated style
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [
      { scale: modalScale.value },
      { translateY: modalTranslateY.value }
    ],
  }));



  // Simple modal entrance animation
  useEffect(() => {
    if (visible && playlist) {
      // Reset modal state
      modalOpacity.value = 0;
      modalScale.value = 0.95;
      modalTranslateY.value = 20;
      
      // Reset PlaylistCard animation
      setShouldAnimateCard(false);

      // Modal entrance animation
      modalOpacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      
      modalScale.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      
      modalTranslateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });

      // Trigger PlaylistCard animation after modal entrance
      setTimeout(() => {
        setShouldAnimateCard(true);
      }, 100);
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
      <Animated.View className="flex-1 bg-black" style={modalAnimatedStyle}>
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 pt-12">
          <TouchableOpacity 
            onPress={onClose} 
            className="p-2 rounded-full bg-black bg-opacity-30 active:bg-opacity-50"
            activeOpacity={0.8}
          >
            <Text className="text-white text-xl font-poppins-bold">✕</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-poppins-bold">Playlist Details</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1">
          {/* Playlist Card - Reusing the same component from creation flow */}
          <View className="px-4 mb-6">
            <PlaylistCard
              name={playlist.name}
              description={playlist.description}
              songCount={playlist.songCount}
              coverImageUrl={playlist.coverImageUrl}
              shouldAnimate={shouldAnimateCard}
              tracks={playlist.tracks}
              compact={true}
            />
          </View>

          {/* Action Buttons */}
          <View className="px-4 mb-6 justify-center items-center">
            <View className="flex-row justify-between gap-3">
              <View className="flex-row gap-3">
                {onSave && (
                  <AnimatedButton
                    title="Save to"
                    icon={require('../../assets/images/spotify-logo.png')}
                    onPress={onSave}
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
              
              {playlist.spotifyUrl && (
                <AnimatedButton
                  title="Open in Spotify"
                  onPress={handleOpenInSpotify}
                  shouldAnimate={true}
                />
              )}
            </View>
          </View>

          {/* Songs List */}
          <View className="px-4 pb-8">
            <Text className="text-white text-lg font-poppins-bold mb-4">Songs</Text>
                          <SongList 
                songs={formatTracksForDisplay()} 
                showScrollView={false}
                shouldAnimate={true}
              />
            </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
} 