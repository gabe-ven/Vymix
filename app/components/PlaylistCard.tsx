import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  Extrapolate,
  SharedValue,
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
  // Inline edit props (optional). If provided, enables tap-to-edit.
  onUpdateTitle?: (newTitle: string) => Promise<void> | void;
  onUpdateDescription?: (newDescription: string) => Promise<void> | void;
  onPressCover?: () => void;
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
  compact = false,
  onUpdateTitle,
  onUpdateDescription,
  onPressCover,
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
      coverOpacity.value = withDelay(
        200,
        withTiming(1, {
          duration: 600,
          easing: Easing.out(Easing.cubic),
        })
      );

      coverScale.value = withDelay(
        200,
        withTiming(1, {
          duration: 600,
          easing: Easing.out(Easing.cubic),
        })
      );

      // Animate title with delay
      titleOpacity.value = withDelay(
        400,
        withTiming(1, {
          duration: 500,
          easing: Easing.out(Easing.cubic),
        })
      );

      titleTranslateY.value = withDelay(
        400,
        withTiming(0, {
          duration: 500,
          easing: Easing.out(Easing.cubic),
        })
      );

      // Animate description with delay
      descriptionOpacity.value = withDelay(
        600,
        withTiming(1, {
          duration: 500,
          easing: Easing.out(Easing.cubic),
        })
      );

      descriptionTranslateY.value = withDelay(
        600,
        withTiming(0, {
          duration: 500,
          easing: Easing.out(Easing.cubic),
        })
      );
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
      transform: [{ translateY }, { scale }],
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
      transform: [{ scale }, { translateY }],
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

  // Inline edit state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [draftTitle, setDraftTitle] = useState(name);
  const [draftDescription, setDraftDescription] = useState(description);
  const titleInputRef = useRef<TextInput>(null);
  const descInputRef = useRef<TextInput>(null);

  useEffect(() => {
    setDraftTitle(name);
  }, [name]);

  useEffect(() => {
    setDraftDescription(description);
  }, [description]);

  useEffect(() => {
    if (isEditingTitle) {
      setTimeout(() => titleInputRef.current?.focus(), 0);
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDescription) {
      setTimeout(() => descInputRef.current?.focus(), 0);
    }
  }, [isEditingDescription]);

  const commitTitle = async () => {
    const trimmed = draftTitle.trim();
    setIsEditingTitle(false);
    if (trimmed && trimmed !== name && onUpdateTitle) {
      await Promise.resolve(onUpdateTitle(trimmed));
    } else {
      setDraftTitle(name);
    }
  };

  const commitDescription = async () => {
    const trimmed = draftDescription.trim();
    setIsEditingDescription(false);
    if (trimmed !== description && onUpdateDescription) {
      await Promise.resolve(onUpdateDescription(trimmed));
    } else {
      setDraftDescription(description);
    }
  };

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
      className={compact ? '' : 'mt-12'}
      style={[cardAnimatedStyle, cardScrollAnimatedStyle]}
    >
      <Glass
        className={compact ? 'w-full p-3' : 'w-full p-4'}
        borderRadius={compact ? 12 : 16}
        blurAmount={25}
        backgroundColor={COLORS.transparent.white[10]}
      >
        <View className="items-center">
          {/* Playlist Cover */}
          <Animated.View
            className={
              compact
                ? 'w-48 h-48 mb-4 rounded-lg'
                : 'w-64 h-64 mb-6 rounded-xl'
            }
            style={[
              coverAnimatedStyle,
              coverScrollAnimatedStyle,
              {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.4,
                shadowRadius: 20,
                elevation: 15,
              },
            ]}
          >
            <TouchableOpacity activeOpacity={0.9} onPress={onPressCover}>
              <Glass
                className="w-full h-full"
                borderRadius={12}
                blurAmount={25}
                backgroundColor={COLORS.transparent.white[10]}
                pointerEvents="none"
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
            </TouchableOpacity>
          </Animated.View>

          {/* Title */}
          {isEditingTitle ? (
            <TextInput
              ref={titleInputRef}
              value={draftTitle}
              onChangeText={setDraftTitle}
              onBlur={commitTitle}
              onSubmitEditing={commitTitle}
              returnKeyType="done"
              style={{
                color: 'white',
                textAlign: 'center',
                fontSize: compact ? 24 : 30,
                fontFamily: 'Poppins-Bold',
                marginBottom: 8,
              }}
              maxLength={120}
              placeholder="Title"
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoCorrect={false}
              blurOnSubmit={true}
            />
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                onUpdateTitle ? setIsEditingTitle(true) : undefined
              }
            >
              <Animated.Text
                className={
                  compact
                    ? 'text-2xl font-bold text-ui-white font-poppins-bold mb-2 text-center leading-tight'
                    : 'text-3xl font-bold text-ui-white font-poppins-bold mb-2 text-center leading-tight'
                }
                numberOfLines={compact ? 1 : 2}
                style={titleAnimatedStyle}
              >
                {name}
              </Animated.Text>
            </TouchableOpacity>
          )}

          {/* Description */}
          {isEditingDescription ? (
            <TextInput
              ref={descInputRef}
              value={draftDescription}
              onChangeText={setDraftDescription}
              onBlur={commitDescription}
              onSubmitEditing={commitDescription}
              returnKeyType="done"
              multiline
              onKeyPress={(e) => {
                // Commit on Enter to avoid inserting new lines
                // @ts-ignore - key exists on nativeEvent in RN
                if (e.nativeEvent?.key === 'Enter') {
                  commitDescription();
                  Keyboard.dismiss();
                }
              }}
              style={{
                color: 'rgba(255,255,255,0.8)',
                textAlign: 'center',
                fontSize: compact ? 14 : 16,
                fontFamily: 'Poppins-Bold',
                lineHeight: compact ? 20 : 22,
                paddingHorizontal: compact ? 8 : 16,
              }}
              maxLength={300}
              placeholder="Description"
              placeholderTextColor="rgba(255,255,255,0.35)"
              blurOnSubmit={true}
            />
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                onUpdateDescription ? setIsEditingDescription(true) : undefined
              }
            >
              <Animated.Text
                className={
                  compact
                    ? 'text-sm text-ui-gray-light font-poppins-bold text-center leading-relaxed px-2'
                    : 'text-base text-ui-gray-light font-poppins-bold text-center leading-relaxed px-4'
                }
                numberOfLines={compact ? 2 : 3}
                style={descriptionAnimatedStyle}
              >
                {description}
              </Animated.Text>
            </TouchableOpacity>
          )}
        </View>
      </Glass>
    </Animated.View>
  );
}
