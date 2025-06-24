import React from 'react';
import { View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';

interface LayoutProps extends ViewProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, style, ...props }) => {
  return (
    <LinearGradient
    colors={COLORS.gradients.background}
    style={[{ flex: 1 }, style]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
}; 