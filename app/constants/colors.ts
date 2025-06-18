// Color constants for the Vymix app
export const COLORS = {
  // Primary gradient colors (yellow to red)
  GOLD: '#FFD700',
  ORANGE: '#FFA500',
  DARK_ORANGE: '#FF8C00',
  TOMATO_RED: '#FF6347',
  ORANGE_RED: '#FF4500',
  CRIMSON_RED: '#DC143C',
  
  // App theme colors
  DARK_PURPLE: '#2b2d5c',
  BLUE: '#211c84',
  DARK_BLUE: '#1A1A1A',
  
  // UI colors
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY: '#686a73',
  GRAY_LIGHT: '#686a73',
  
  // Background colors
  TAB_BAR_BG: '#151623',
  
  // Gradient arrays for easy use
  WAVE_GRADIENT: ['#FFD700', '#FFA500', '#FF6347', '#FF4500', '#DC143C'] as const,
  WAVE_GRADIENT_REVERSE: ['#DC143C', '#FF4500', '#FF6347', '#FFA500', '#FFD700'] as const,
  
  // Legacy gradient (for backward compatibility)
  LEGACY_GRADIENT: ['#FFD700', '#FF4500'] as const,
} as const;

// Type for gradient colors
export type GradientColors = typeof COLORS.WAVE_GRADIENT; 