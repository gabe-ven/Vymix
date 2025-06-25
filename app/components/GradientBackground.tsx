import React from 'react';
import { View, StyleSheet, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  interpolate, 
  Extrapolate,
  SharedValue
} from 'react-native-reanimated';

interface GradientBackgroundProps {
  colors: {
    primary: string;
    secondary: string;
    background: string;
  } | string[];
  children: React.ReactNode;
  scrollY?: SharedValue<number>;
}

export default function GradientBackground({ colors, children, scrollY }: GradientBackgroundProps) {
  // Handle both old format and new color palette format
  const gradientColors = Array.isArray(colors) 
    ? (colors.length >= 2 ? colors : ['#000000', '#000000'])
    : [colors.primary, colors.secondary, colors.background];

  // Use only the 3 colors from the palette for a clean gradient
  const topGradientColors = [...gradientColors];

  // Create locations that create smooth transitions between the 3 colors
  // and then transition to dark for the bottom half
  const gradientLocations = [
    0,      // Start with first color
    0.2,    // First color blends into second
    0.6,    // Second color blends into third
    0.8,    // Third color starts fading to dark
    1       // End with dark color
  ];

  // Add dark color to the end of the gradient
  const fullGradientColors = [...topGradientColors, '#1a1a1a'];

  // Create animated style for gradient opacity
  const gradientAnimatedStyle = useAnimatedStyle(() => {
    const opacity = scrollY 
      ? interpolate(
          scrollY.value,
          [0, 300],
          [0.5, 0.15],
          Extrapolate.CLAMP
        )
      : 0.5;

    return {
      opacity,
    };
  });

  return (
    <View style={styles.container}>
      {/* Static black background */}
      <View style={[styles.gradient, { backgroundColor: '#000000' }]} />
      
      {/* Animated gradient overlay */}
      <Animated.View style={[styles.gradient, gradientAnimatedStyle]}>
        <LinearGradient
          colors={fullGradientColors as any}
          locations={gradientLocations as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        />
      </Animated.View>
      
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
  },
}); 