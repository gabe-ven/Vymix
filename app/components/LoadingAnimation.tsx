import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '../constants/colors';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence,
  Easing
} from 'react-native-reanimated';

interface LoadingAnimationProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  message = 'Loading...',
  size = 'medium'
}) => {
  const pulseAnim = useSharedValue(1);
  const fadeAnim = useSharedValue(0);

  useEffect(() => {
    // Start fade in animation
    fadeAnim.value = withTiming(1, { duration: 500 });
    
    // Start pulse animation
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite repeat
      false // Don't reverse
    );
  }, []);

  const fadeAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
    };
  });

  const pulseAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseAnim.value }],
    };
  });

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
      style={fadeAnimatedStyle}
    >
      <Animated.View
        style={[
          getSizeStyles(),
          {
            backgroundColor: COLORS.primary.lime,
          },
          pulseAnimatedStyle,
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