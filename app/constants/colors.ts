// Color constants for the Vymix app
export const COLORS = {
  // 🎨 Primary Brand Colors
  primary: {
    lime: '#B6F500',      // Primary accent (tab icons, focused states)
    orange: '#FF8C00',    // Primary orange (sliders, accents)
    yellow: '#FFFF00',
    darkPurple: '#1e0e2f',
  },

  // 🌈 Gradient Colors
  gradients: {
    wave: ['#FFAF00', '#FF8C00', '#FF4E00', '#FF2C00', '#FF1E00'] as const,
    background: ['#120c2c', '#1b1040', '#29185a'] as const
  },

  // 🎯 UI Colors
  ui: {
    white: '#FFFFFF',
    black: '#000000',
    gray: {
      light: '#E0E0E0',   // Inactive text/icons
      medium: '#686a73',  // Slider track
      dark: '#666666',    // Profile icon
    },
  },

  // 🎭 Background Colors
  background: {
    dark: '#151623',      // Card backgrounds
    darker: '#1a1a1a',    // Profile avatar
  },

  // 🎪 Interactive States
  states: {
    focused: '#B6F500',   // Active/focused state
    inactive: '#E0E0E0',  // Inactive state
  },

  // 🎨 Transparent Colors
  transparent: {
    white: {
      5: 'rgba(255, 255, 255, 0.05)',
      10: 'rgba(255, 255, 255, 0.1)',
    },
  },
} as const;

// Type exports for better TypeScript support
export type WaveGradient = typeof COLORS.gradients.wave;
export type BackgroundGradient = typeof COLORS.gradients.background;

// Legacy exports for backward compatibility
export const LEGACY_COLORS = {
  WAVE_GRADIENT: COLORS.gradients.wave,
  BRIGHT_YELLOW: '#FFFF00',
  YELLOW_ORANGE: '#FFCC00',
  ORANGE: '#FF8000',
  DARK_ORANGE: '#FF6000',
  DEEP_ORANGE: '#FF4000',
} as const; 