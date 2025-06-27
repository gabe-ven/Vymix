import React, { useEffect } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  withSpring,
  Easing,
  interpolate,
  Extrapolate,
  SharedValue
} from 'react-native-reanimated';
import { COLORS } from '../constants/colors';
import Glass from './Glass';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
  delay?: number;
  shouldAnimate?: boolean;
  scrollY?: SharedValue<number>;
}

export default function AnimatedButton({ 
  title, 
  onPress, 
  variant = 'primary',
  className = '',
  delay = 0,
  shouldAnimate = false,
  scrollY
}: AnimatedButtonProps) {
  // Animation values - always start from initial state
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.8);
  const buttonTranslateY = useSharedValue(30);

  useEffect(() => {
    if (shouldAnimate) {
      // Animate button with delay
      buttonOpacity.value = withDelay(delay, withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      }));
      
      buttonScale.value = withDelay(delay, withSpring(1, {
        damping: 15,
        stiffness: 150,
      }));
      
      buttonTranslateY.value = withDelay(delay, withTiming(0, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      }));
    }
  }, [shouldAnimate, delay]);

  // Scroll-based animated styles
  const buttonScrollAnimatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    
    const translateY = interpolate(
      scrollY.value,
      [0, 200],
      [0, -30],
      Extrapolate.CLAMP
    );
    
    const scale = interpolate(
      scrollY.value,
      [0, 200],
      [1, 0.9],
      Extrapolate.CLAMP
    );
    
    const opacity = interpolate(
      scrollY.value,
      [0, 150, 300],
      [1, 0.8, 0.6],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateY },
        { scale }
      ],
      opacity,
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [
      { scale: buttonScale.value },
      { translateY: buttonTranslateY.value }
    ],
  }));

  return (
    <Animated.View style={[
      buttonAnimatedStyle,
      buttonScrollAnimatedStyle
    ]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Glass 
          className={`rounded-full shadow-lg ${className}`}
          blurAmount={20}
          backgroundColor={COLORS.transparent.white[10]}
        >
          <Text className="text-ui-white font-bold text-base font-poppins-bold px-6 py-3">
            {title}
          </Text>
        </Glass>
      </TouchableOpacity>
    </Animated.View>
  );
} 