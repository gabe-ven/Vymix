import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { COLORS } from '../constants/colors';

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps = 4,
}) => {
  const fillAnimations = useRef<Animated.Value[]>(
    Array.from({ length: totalSteps }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    fillAnimations.forEach((animation, index) => {
      const shouldFill = index < currentStep;
      const targetValue = shouldFill ? 1 : 0;

      Animated.timing(animation, {
        toValue: targetValue,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  }, [currentStep, fillAnimations]);

  return (
    <View className="flex-row items-center justify-center px-6 py-8 gap-4">
      {Array.from({ length: totalSteps }, (_, index) => {
        const fillWidth = fillAnimations[index].interpolate({
          inputRange: [0, 1],
          outputRange: ['0%', '100%'],
        });

        return (
          <View
            key={index}
            className="h-1.5 rounded-full bg-gray-600 overflow-hidden"
            style={{ width: 80 }}
          >
            <Animated.View
              className="h-full rounded-full"
              style={{
                width: fillWidth,
                backgroundColor: COLORS.primary.lime,
              }}
            />
          </View>
        );
      })}
    </View>
  );
};
