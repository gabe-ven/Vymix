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
    ? (colors.length >= 2 ? colors : ['#1DB954', '#191414', '#1ED760'])
    : [colors.primary, colors.secondary, colors.background];

  // Use all colors from the palette for a richer gradient
  const paletteColors = Array.isArray(colors) ? colors : [colors.primary, colors.secondary, colors.background];
  
  // Create smooth gradient locations based on the number of colors
  const gradientLocations = paletteColors.map((_, index) => 
    index / (paletteColors.length - 1)
  );

  // Add a subtle dark fade at the end
  const fullGradientColors = [...paletteColors, '#000000'];
  const fullGradientLocations = [...gradientLocations, 1];

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
          locations={fullGradientLocations as any}
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