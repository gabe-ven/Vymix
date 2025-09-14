import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  style,
  className = '',
  edges = ['top', 'bottom', 'left', 'right'],
}) => {
  const insets = useSafeAreaInsets();

  const safeAreaStyle: ViewStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View style={[safeAreaStyle, style]} className={className}>
      {children}
    </View>
  );
};
