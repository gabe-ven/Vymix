import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { COLORS } from '../constants/colors';

interface LoadingAnimationProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  message = 'Loading...',
  size = 'medium'
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    const fadeAnimation = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    });

    fadeAnimation.start();
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
      fadeAnimation.stop();
    };
  }, [pulseAnim, fadeAnim]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 40, height: 40, borderRadius: 20 };
      case 'large':
        return { width: 80, height: 80, borderRadius: 40 };
      default:
        return { width: 60, height: 60, borderRadius: 30 };
    }
  };

  return (
    <Animated.View 
      className="items-center justify-center"
      style={{ opacity: fadeAnim }}
    >
      <Animated.View
        style={[
          getSizeStyles(),
          {
            backgroundColor: COLORS.primary.lime,
            transform: [{ scale: pulseAnim }],
          },
        ]}
        className="items-center justify-center"
      >
        <View 
          style={[
            getSizeStyles(),
            { 
              backgroundColor: COLORS.primary.darkPurple,
              position: 'absolute',
            }
          ]}
        />
      </Animated.View>
      
      <Text className="text-ui-white text-lg mt-4 font-poppins text-center px-4">
        {message}
      </Text>
    </Animated.View>
  );
}; 