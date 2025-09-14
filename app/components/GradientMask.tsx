import React, { ReactElement } from 'react';
import { View, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { COLORS } from '../constants/colors';

interface GradientMaskProps {
  children: ReactElement;
  width?: number;
  height?: number;
  colors?: readonly [ColorValue, ColorValue, ...ColorValue[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export const GradientMask = ({
  children,
  width,
  height,
  colors = COLORS.gradients.wave,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
}: GradientMaskProps) => (
  <View style={{ width, height }}>
    <MaskedView
      style={{ width: '100%', height: '100%' }}
      maskElement={children}
    >
      <LinearGradient
        colors={colors}
        start={start}
        end={end}
        style={{ width: '100%', height: '100%' }}
      >
        <View style={{ opacity: 0 }}>{children}</View>
      </LinearGradient>
    </MaskedView>
  </View>
);
