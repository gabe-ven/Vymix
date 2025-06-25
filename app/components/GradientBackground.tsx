import React from 'react';
import { View, StyleSheet, ColorValue, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientBackgroundProps {
  colors: {
    primary: string;
    secondary: string;
    background: string;
  } | string[];
  children: React.ReactNode;
  scrollY?: Animated.Value;
}

export default function GradientBackground({ colors, children, scrollY }: GradientBackgroundProps) {
  // Handle both old format and new color palette format
  const gradientColors = Array.isArray(colors) 
    ? (colors.length >= 2 ? colors : ['#000000', '#000000'])
    : [colors.primary, colors.secondary, colors.background];

  // Create animated opacity for the gradient
  const gradientOpacity = scrollY ? scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [0.5, 0.15],
    extrapolate: 'clamp'
  }) : new Animated.Value(0.5);

  // Use all colors from the palette for a rich gradient
  const topGradientColors = [
    ...gradientColors,
    '#1a1a1a',
    '#000000'
  ];

  // Create locations that create smooth, blended transitions
  const colorCount = gradientColors.length;
  const gradientLocations = [
    0,                    // Start with first color
    0.25,                 // First color blends into second
    0.6,                  // Second color blends into third
    0.8,                  // Third color starts fading to dark
    1                     // Pure black at bottom
  ];

  return (
    <View style={styles.container}>
      {/* Static black background */}
      <View style={[styles.gradient, { backgroundColor: '#000000' }]} />
      
      {/* Animated gradient overlay */}
      <Animated.View style={[styles.gradient, { opacity: gradientOpacity }]}>
        <LinearGradient
          colors={topGradientColors as any}
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