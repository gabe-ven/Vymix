import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/colors';

interface GlassProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
  blurAmount?: number;
  borderRadius?: number;
  backgroundColor?: string;
  initialBackgroundColor?: string;
  borderColor?: string;
  shadowColor?: string;
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
  variant?: 'default' | 'card' | 'header' | 'accent';
  tint?: 'light' | 'dark' | 'default';
  initialTint?: 'light' | 'dark' | 'default';
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
}

export const Glass: React.FC<GlassProps> = ({
  children,
  style,
  className = '',
  blurAmount = 25,
  borderRadius = 24,
  backgroundColor = COLORS.transparent.white[5],
  initialBackgroundColor,
  borderColor,
  shadowColor = COLORS.ui.black,
  shadowOpacity,
  shadowRadius,
  elevation,
  variant = 'default',
  tint = 'light',
  initialTint,
  pointerEvents = 'auto',
}) => {
  // Define variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'card':
        return {
          borderColor: borderColor || COLORS.transparent.white[15],
          shadowOpacity: shadowOpacity ?? 0.2,
          shadowRadius: shadowRadius ?? 12,
          elevation: elevation ?? 8,
          shadowOffset: { width: 0, height: 8 },
        };
      case 'header':
        return {
          borderColor: borderColor || COLORS.transparent.white[10],
          shadowOpacity: shadowOpacity ?? 0.1,
          shadowRadius: shadowRadius ?? 6,
          elevation: elevation ?? 3,
          shadowOffset: { width: 0, height: 4 },
        };
      case 'accent':
        return {
          borderColor: borderColor || `${COLORS.primary.lime}40`,
          shadowOpacity: shadowOpacity ?? 0.25,
          shadowRadius: shadowRadius ?? 16,
          elevation: elevation ?? 10,
          shadowOffset: { width: 0, height: 10 },
        };
      default:
        return {
          borderColor: borderColor || COLORS.transparent.white[10],
          shadowOpacity: shadowOpacity ?? 0.08,
          shadowRadius: shadowRadius ?? 8,
          elevation: elevation ?? 5,
          shadowOffset: { width: 0, height: 8 },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <BlurView
      intensity={blurAmount}
      tint={mounted ? tint : initialTint || tint}
      pointerEvents={pointerEvents}
      style={[
        styles.glass,
        {
          borderRadius,
          backgroundColor: mounted
            ? backgroundColor
            : initialBackgroundColor || backgroundColor,
          borderColor: variantStyles.borderColor,
          shadowColor,
          shadowOpacity: variantStyles.shadowOpacity,
          shadowRadius: variantStyles.shadowRadius,
          shadowOffset: variantStyles.shadowOffset,
          elevation: variantStyles.elevation,
        },
        style,
      ]}
      className={className}
    >
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  glass: {
    overflow: 'hidden',
    borderWidth: 1,
  },
});

export default Glass;
