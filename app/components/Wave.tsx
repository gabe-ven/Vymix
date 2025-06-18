// components/Wave.tsx
import React from "react";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { View, Dimensions } from "react-native";
import { COLORS } from '../constants/colors';

const { width: screenWidth } = Dimensions.get('window');

export const TopWave = () => (
  <View className="absolute top-0 left-0 right-0">
    <Svg height="120" width="100%" viewBox={`0 0 ${screenWidth} 120`} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="topGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={COLORS.GOLD} stopOpacity="0.9" />
          <Stop offset="25%" stopColor={COLORS.ORANGE} stopOpacity="0.85" />
          <Stop offset="50%" stopColor={COLORS.TOMATO_RED} stopOpacity="0.8" />
          <Stop offset="75%" stopColor={COLORS.ORANGE_RED} stopOpacity="0.75" />
          <Stop offset="100%" stopColor={COLORS.CRIMSON_RED} stopOpacity="0.7" />
        </LinearGradient>
      </Defs>
      <Path
        fill="url(#topGradient)"
        d={`M0,120 
           Q${screenWidth * 0.2},80 ${screenWidth * 0.4},100 
           Q${screenWidth * 0.6},120 ${screenWidth * 0.8},90 
           Q${screenWidth},60 ${screenWidth},60 
           L${screenWidth},0 L0,0 Z`}
      />
    </Svg>
  </View>
);

export const BottomWave = () => (
  <View className="absolute bottom-0 left-0 right-0">
    <Svg height="120" width="100%" viewBox={`0 0 ${screenWidth} 120`} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="bottomGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={COLORS.CRIMSON_RED} stopOpacity="0.7" />
          <Stop offset="25%" stopColor={COLORS.ORANGE_RED} stopOpacity="0.75" />
          <Stop offset="50%" stopColor={COLORS.TOMATO_RED} stopOpacity="0.8" />
          <Stop offset="75%" stopColor={COLORS.ORANGE} stopOpacity="0.85" />
          <Stop offset="100%" stopColor={COLORS.GOLD} stopOpacity="0.9" />
        </LinearGradient>
      </Defs>
      <Path
        fill="url(#bottomGradient)"
        d={`M0,0 
           Q${screenWidth * 0.2},40 ${screenWidth * 0.4},20 
           Q${screenWidth * 0.6},0 ${screenWidth * 0.8},30 
           Q${screenWidth},60 ${screenWidth},60 
           L${screenWidth},120 L0,120 Z`}
      />
    </Svg>
  </View>
);
