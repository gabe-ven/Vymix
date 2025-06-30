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
  const progressAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  
  // Wave bar animations
  const waveBars = useRef(Array.from({ length: 8 }, () => new Animated.Value(0.2))).current;

  // Text state
  const [displayText, setDisplayText] = useState('');
  const [progressText, setProgressText] = useState('');

  // Check if we're finding songs
  const isFindingSongs = progress?.phase?.toLowerCase().includes('found') || 
                        progress?.phase?.toLowerCase().includes('finding songs') ||
                        progress?.phase?.toLowerCase().includes('finding');

  // Main rotation and text animations
  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const textFadeAnimation = Animated.timing(textFadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    rotateAnimation.start();
    textFadeAnimation.start();

    // Handle progress bar for song finding only
    if (progress && isFindingSongs) {
      const progressPercentage = (progress.current / progress.total) * 100;
      const progressText = `${progress.current}/${progress.total}`;
      setProgressText(progressText);
      
      Animated.timing(progressAnim, {
        toValue: progressPercentage,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }

    // Set display text
    if (progress?.phase) {
      setDisplayText(progress.phase);
    } else {
      setDisplayText(message);
    }

    return () => {
      rotateAnimation.stop();
    };
  }, [progress?.phase, progress?.current, progress?.total, isFindingSongs]);

  // Wave bar animations
  useEffect(() => {
    const waveAnimations = waveBars.map((bar, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 100), // Stagger the animations
          Animated.timing(bar, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: 0.2,
            duration: 600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    });

    // Start all wave animations
    waveAnimations.forEach(animation => animation.start());

    return () => {
      waveAnimations.forEach(animation => animation.stop());
    };
  }, []);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { 
          containerWidth: 120, 
          containerHeight: 60, 
          barWidth: 8, 
          barSpacing: 4,
          maxBarHeight: 40
        };
      case 'large':
        return { 
          containerWidth: 200, 
          containerHeight: 100, 
          barWidth: 12, 
          barSpacing: 6,
          maxBarHeight: 70
        };
      default:
        return { 
          containerWidth: 160, 
          containerHeight: 80, 
          barWidth: 10, 
          barSpacing: 5,
          maxBarHeight: 55
        };
    }
  };

  // Animation interpolations
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const sizeStyles = getSizeStyles();

  return (
    <Layout>
      <View className="items-center justify-center flex-1 px-6">
        {/* Wave bars animation */}
        <View className="items-center justify-center mb-8">
          <View 
            style={{
              width: sizeStyles.containerWidth,
              height: sizeStyles.containerHeight,
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
          >
            {waveBars.map((bar, index) => (
              <Animated.View
                key={index}
                style={{
                  width: sizeStyles.barWidth,
                  height: sizeStyles.maxBarHeight,
                  backgroundColor: COLORS.primary.lime,
                  marginHorizontal: sizeStyles.barSpacing / 2,
                  borderRadius: sizeStyles.barWidth / 2,
                  shadowColor: COLORS.primary.lime,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 4,
                  elevation: 3,
                  transform: [
                    {
                      scaleY: bar.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.2, 1],
                      })
                    }
                  ],
                }}
              />
            ))}
          </View>
        </View>

        {/* Text */}
        <Animated.View
          style={{
            opacity: textFadeAnim,
          }}
          className="items-center mb-4"
        >
          <Text className="text-white text-xl font-semibold text-center font-poppins">
            {displayText}
          </Text>
        </Animated.View>

        {/* Progress Bar - Only show when finding songs */}
        {isFindingSongs && progress && (
          <View className="w-full mb-4">
            {/* Progress bar */}
            <View 
              className="h-3 bg-gray-800 rounded-full overflow-hidden"
              style={{ 
                backgroundColor: COLORS.background.dark,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Animated.View
                style={{
                  width: progressBarWidth,
                  height: '100%',
                  backgroundColor: COLORS.primary.lime,
                  borderRadius: 6,
                  shadowColor: COLORS.primary.lime,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              />
            </View>
          
          </View>
        )}
      </View>
    </Layout>
  );
};
     