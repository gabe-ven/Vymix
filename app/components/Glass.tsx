import React from 'react';
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
}

export const Glass: React.FC<GlassProps> = ({
  children,
  style,
  className = '',
  blurAmount = 25,
  borderRadius = 24,
  backgroundColor = COLORS.transparent.white[5],
}) => {
  return (
    <BlurView
      intensity={blurAmount}
      tint="light"
      style={[
        styles.glass,
        { borderRadius, backgroundColor },
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
    borderColor: COLORS.transparent.white[10],
    shadowColor: COLORS.ui.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default Glass; 