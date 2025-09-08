import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Linking, Alert, Platform, ActionSheetIOS } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
import { updatePlaylistMetadata } from '../../services';
import SongList from './SongList';
import AnimatedButton from './AnimatedButton';
import PlaylistCard from './PlaylistCard';
import Glass from './Glass';

interface PlaylistModalProps {
  visible: boolean;
  playlist: PlaylistData | null;
  onClose: () => void;
  onDelete?: () => void;
  onSave?: () => void;
}

export default function PlaylistModal({ visible, playlist, onClose, onDelete, onSave }: PlaylistModalProps) {
  const [shouldAnimateCard, setShouldAnimateCard] = useState(false);
  const [shouldAnimateButtons, setShouldAnimateButtons] = useState(false);
  const [localTitle, setLocalTitle] = useState<string | undefined>(undefined);
  const [localDescription, setLocalDescription] = useState<string | undefined>(undefined);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [localCoverUrl, setLocalCoverUrl] = useState<string | undefined>(undefined);
  
  
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
      setShouldAnimateButtons(false);

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
        setShouldAnimateButtons(true);
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

  const handleChangeCover = async () => {
    if (!playlist?.id) return;
    try {
      if (isPickingImage) return;
      setIsPickingImage(true);
      const pickFromLibrary = async () => {
        if (Platform.OS === 'android') {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (perm.status !== 'granted') {
            Alert.alert('Permission needed', 'We need access to your photo library to change the cover.');
            return null;
          }
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          quality: 0.9,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          aspect: [1, 1],
          base64: true,
        });
        return result;
      };

      const takePhoto = async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Permission needed', 'We need camera access to take a cover photo.');
          return null;
        }
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.9,
          base64: true,
          aspect: [1, 1],
        });
        return result;
      };

      const chooseAndProcess = async (source: 'library' | 'camera') => {
        const result = source === 'library' ? await pickFromLibrary() : await takePhoto();
        if (!result || result.canceled || !result.assets?.length) return false;
        const asset = result.assets[0];
        const base64 = asset.base64;
        if (!base64) {
          Alert.alert('Error', 'Failed to read selected image.');
          return false;
        }
        const { uploadBase64ImageToStorage } = await import('../../services/storageService');
        const path = `covers/users/${playlist.userId || 'unknown'}/${playlist.id}.jpg`;
        const downloadUrl = await uploadBase64ImageToStorage(path, base64, 'image/jpeg');
        await updatePlaylistMetadata(playlist.id, { coverImageUrl: downloadUrl });
        setLocalCoverUrl(downloadUrl);
        return true;
      };

      if (Platform.OS === 'ios') {
        await new Promise<void>((resolve) => {
          ActionSheetIOS.showActionSheetWithOptions(
            {
              options: ['Cancel', 'Choose from Library', 'Take Photo'],
              cancelButtonIndex: 0,
            },
            async (buttonIndex) => {
              if (buttonIndex === 1) {
                await chooseAndProcess('library');
              } else if (buttonIndex === 2) {
                await chooseAndProcess('camera');
              }
              resolve();
            }
          );
        });
      } else {
        // Simple Android chooser via Alert buttons
        await new Promise<void>((resolve) => {
          Alert.alert(
            'Change cover',
            undefined,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
              { text: 'Choose from Library', onPress: async () => { await chooseAndProcess('library'); resolve(); } },
              { text: 'Take Photo', onPress: async () => { await chooseAndProcess('camera'); resolve(); } },
            ]
          );
        });
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update cover image. Please try again.');
    } finally {
      setIsPickingImage(false);
    }
  };

  

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={onClose}
    >
      <Animated.View className="flex-1" style={[modalAnimatedStyle, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
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
          {/* Playlist Card (read-only) */}
          <View className="px-4 mb-6">
            <PlaylistCard
              name={localTitle ?? playlist.name}
              description={localDescription ?? playlist.description}
              songCount={playlist.songCount}
              coverImageUrl={localCoverUrl ?? playlist.coverImageUrl}
              shouldAnimate={shouldAnimateCard}
              tracks={playlist.tracks}
              compact={true}
              onPressCover={handleChangeCover}
              onUpdateTitle={async (newTitle) => {
                if (!playlist?.id) return;
                setLocalTitle(newTitle);
                try {
                  await updatePlaylistMetadata(playlist.id, { name: newTitle });
                } catch (e) {
                  setLocalTitle(undefined);
                }
              }}
              onUpdateDescription={async (newDescription) => {
                if (!playlist?.id) return;
                setLocalDescription(newDescription);
                try {
                  await updatePlaylistMetadata(playlist.id, { description: newDescription });
                } catch (e) {
                  setLocalDescription(undefined);
                }
              }}
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
                    shouldAnimate={shouldAnimateButtons}
                    delay={900}
                  />
                )}
                
                {onDelete && (
                  <AnimatedButton
                    title="Delete"
                    onPress={onDelete}
                    shouldAnimate={shouldAnimateButtons}
                    delay={1050}
                  />
                )}
              </View>
              
              {playlist.spotifyUrl && (
                <AnimatedButton
                  title="Open in Spotify"
                  onPress={handleOpenInSpotify}
                  shouldAnimate={shouldAnimateButtons}
                  delay={1200}
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