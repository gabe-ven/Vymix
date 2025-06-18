import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

interface ScreenDimensions {
  width: number;
  height: number;
}

export const useResponsive = () => {
  const [screenDimensions, setScreenDimensions] = useState<ScreenDimensions>({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions({
        width: window.width,
        height: window.height,
      });
    });

    return () => subscription?.remove();
  }, []);

  const isSmallScreen = screenDimensions.width < 375;
  const isMediumScreen = screenDimensions.width >= 375 && screenDimensions.width < 768;
  const isLargeScreen = screenDimensions.width >= 768;
  const isTablet = screenDimensions.width >= 768 && screenDimensions.height >= 1024;

  const getResponsiveValue = <T>(
    small: T,
    medium: T,
    large: T
  ): T => {
    if (isSmallScreen) return small;
    if (isMediumScreen) return medium;
    return large;
  };

  return {
    screenDimensions,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isTablet,
    getResponsiveValue,
  };
}; 