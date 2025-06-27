import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import Glass from './Glass';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onHide: () => void;
  duration?: number;
}

const { width } = Dimensions.get('window');

export default function Toast({ 
  visible, 
  message, 
  type = 'success', 
  onHide, 
  duration = 3000 
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide down from top
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    // Slide back up
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'info':
        return 'information-circle';
      default:
        return 'checkmark-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#10B981'; // Green
      case 'error':
        return '#EF4444'; // Red
      case 'info':
        return '#3B82F6'; // Blue
      default:
        return '#10B981';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <View className="px-4 pt-12 pb-4">
        <Glass
          className="p-4"
          borderRadius={16}
          blurAmount={25}
          backgroundColor={COLORS.transparent.white[10]}
        >
          <View className="flex-row items-center">
            <Ionicons 
              name={getIcon() as any} 
              size={24} 
              color={getIconColor()} 
            />
            <Text className="text-ui-white font-poppins-bold text-base ml-3 flex-1">
              {message}
            </Text>
          </View>
        </Glass>
      </View>
    </Animated.View>
  );
} 