import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { COLORS } from '../constants/colors';
import { Layout } from './Layout';

interface LoadingAnimationProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  mood?: string;
  progress?: {
    current: number;
    total: number;
    phase: string;
  };
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  message = 'Loading...',
  size = 'medium',
  mood = 'chill',
  progress
}) => {
  // Animation values
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Typing text state
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [displayText, setDisplayText] = useState('');

  // Loading phrases based on mood
  const getLoadingPhrases = () => {
    const genericPhrases = [
      '🎵 Finding the perfect tracks...',
      '✨ Crafting your playlist...',
      '🎧 Analyzing your vibe...',
      '🌟 Discovering amazing music...',
      '🎶 Curating something special...',
      '💫 Mixing the right energy...',
      '🎼 Creating your soundtrack...',
      '🔥 Building the perfect flow...'
    ];

    return genericPhrases;
  };

  const loadingPhrases = getLoadingPhrases();

  useEffect(() => {
    // Smooth rotation animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Subtle pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    // Animated dots
    const dotsAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(dotsAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(dotsAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    // Start animations
    rotateAnimation.start();
    pulseAnimation.start();
    if (progress) {
      dotsAnimation.start();
    }

    // Animate progress bar smoothly
    if (progress) {
      const progressPercentage = (progress.current / progress.total) * 100;
      console.log('Animating progress to:', progressPercentage);
      Animated.timing(progressAnim, {
        toValue: progressPercentage,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }

    // If we have progress data, use the actual phase
    if (progress?.phase) {
      setDisplayText(progress.phase);
    } else {
      // Typing text animation for generic phrases
      const typeText = () => {
        const phrase = loadingPhrases[currentPhrase];
        let index = 0;
        
        const typeInterval = setInterval(() => {
          if (index <= phrase.length) {
            setDisplayText(phrase.slice(0, index));
            index++;
          } else {
            clearInterval(typeInterval);
            // Wait before next phrase
            setTimeout(() => {
              setCurrentPhrase((prev) => (prev + 1) % loadingPhrases.length);
            }, 2000);
          }
        }, 100);
      };

      typeText();
    }

    return () => {
      rotateAnimation.stop();
      pulseAnimation.stop();
      dotsAnimation.stop();
    };
  }, [currentPhrase, progress?.phase, progress?.current, progress?.total]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 60, height: 60, borderRadius: 30 };
      case 'large':
        return { width: 120, height: 120, borderRadius: 60 };
      default:
        return { width: 100, height: 100, borderRadius: 50 };
    }
  };

  // Interpolate rotation
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Subtle pulse scale
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.95, 1.05, 0.95],
  });

  // Dots opacity
  const dotsOpacity = dotsAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  // Check if we're in the song finding phase
  const isFindingSongs = progress?.phase?.toLowerCase().includes('found') || 
                        progress?.phase?.toLowerCase().includes('finding songs') ||
                        progress?.phase?.toLowerCase().includes('finding');
  const isCreatingCover = progress?.phase?.toLowerCase().includes('creating cover') || 
                         progress?.phase?.toLowerCase().includes('cover');

  // Debug logging
  console.log('LoadingAnimation Debug:', {
    progress,
    phase: progress?.phase,
    isFindingSongs,
    isCreatingCover,
    current: progress?.current,
    total: progress?.total
  });

  // Add listener to track progressAnim changes
  useEffect(() => {
    const listener = progressAnim.addListener(({ value }) => {
      console.log('ProgressAnim value changed to:', value);
    });
    
    return () => progressAnim.removeListener(listener);
  }, [progressAnim]);

  return (
    <Layout>
      <View className="items-center justify-center flex-1">
        {/* Main animated circle */}
        <Animated.View
          style={[
            getSizeStyles(),
            {
              backgroundColor: COLORS.primary.lime,
              transform: [
                { rotate: spin },
                { scale: pulseScale }
              ],
            },
          ]}
          className="items-center justify-center"
        >
          <Animated.View 
            style={[
              getSizeStyles(),
              { 
                backgroundColor: COLORS.primary.darkPurple,
                position: 'absolute',
                transform: [{ scale: pulseScale }],
                borderRadius: getSizeStyles().borderRadius,
              },
            ]}
          />
        </Animated.View>
        
        {/* Clean text container */}
        <View 
          className="mt-8 px-6 py-4"
          style={{
            minHeight: 60,
            justifyContent: 'center',
          }}
        >
          <Animated.Text 
            className="text-xl font-poppins text-center text-ui-white"
            style={{
              minHeight: 30,
            }}
          >
            {displayText}
            {!progress && <Text className="text-ui-white">|</Text>}
          </Animated.Text>
         
          {/* Clean progress bar - show for any progress data */}
          {progress && (
            <View style={{ marginTop: 20, width: '100%' }}>
              <View className="w-full bg-ui-gray-dark rounded-full h-2 overflow-hidden">
                <Animated.View 
                  className="h-2 rounded-full"
                  style={{ 
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: COLORS.primary.lime,
                  }}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </Layout>
  );
}; 