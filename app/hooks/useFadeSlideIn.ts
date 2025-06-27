import { useAnimatedStyle, withTiming, withDelay, SharedValue } from 'react-native-reanimated';

interface UseFadeSlideInOptions {
  delay?: number;
  duration?: number;
  startTranslateY?: number;
  scrollY?: SharedValue<number>;
  scrollFadeRange?: readonly [number, number];
}

export const useFadeSlideIn = (
  sharedValue: SharedValue<number>,
  options: UseFadeSlideInOptions = {}
) => {
  const {
    delay = 0,
    duration = 600,
    startTranslateY = 30,
    scrollY,
    scrollFadeRange
  } = options;

  return useAnimatedStyle(() => {
    const baseOpacity = sharedValue.value;
    const baseTranslateY = sharedValue.value * startTranslateY;

    // If scrollY is provided, apply scroll-based fade
    if (scrollY && scrollFadeRange) {
      const scrollOpacity = Math.max(0, 1 - (scrollY.value - scrollFadeRange[0]) / (scrollFadeRange[1] - scrollFadeRange[0]));
      return {
        opacity: baseOpacity * scrollOpacity,
        transform: [{ translateY: baseTranslateY }]
      };
    }

    return {
      opacity: baseOpacity,
      transform: [{ translateY: baseTranslateY }]
    };
  });
};

export const useFadeSlideInWithDelay = (
  sharedValue: SharedValue<number>,
  delay: number,
  duration: number = 600
) => {
  return useAnimatedStyle(() => {
    return {
      opacity: withDelay(delay, withTiming(sharedValue.value, { duration })),
      transform: [{ 
        translateY: withDelay(delay, withTiming(0, { duration })) 
      }]
    };
  });
}; 