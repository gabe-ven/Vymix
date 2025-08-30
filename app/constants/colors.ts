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
      15: 'rgba(255, 255, 255, 0.15)',
      20: 'rgba(255, 255, 255, 0.2)',
    },
    black: {
      10: 'rgba(0, 0, 0, 0.1)',
      20: 'rgba(0, 0, 0, 0.2)',
      30: 'rgba(0, 0, 0, 0.3)',
    },
  },

  // 🌈 Extended Gradient Collections
  musicGradients: {
    electronic: ['#667eea', '#764ba2'],
    pop: ['#f093fb', '#f5576c'],
    chill: ['#4facfe', '#00f2fe'],
    nature: ['#43e97b', '#38f9d7'],
    sunset: ['#fa709a', '#fee140'],
    dreamy: ['#a8edea', '#fed6e3'],
    warm: ['#ffecd2', '#fcb69f'],
    cosmic: ['#667eea', '#764ba2'],
    ocean: ['#209cff', '#68e0cf'],
    fire: ['#ff6b6b', '#feca57'],
    forest: ['#26de81', '#20bf6b'],
    lavender: ['#c44569', '#f8b500'],
  } as const,
} as const;

// Type exports for better TypeScript support
export type WaveGradient = typeof COLORS.gradients.wave;
export type BackgroundGradient = typeof COLORS.gradients.background;
export type MusicGradient = keyof typeof COLORS.musicGradients;

// Helper function to get a gradient by mood/genre
export const getGradientByMood = (mood?: string): readonly [string, string] => {
  if (!mood) return COLORS.musicGradients.electronic;
  
  const moodLower = mood.toLowerCase();
  
  if (moodLower.includes('chill') || moodLower.includes('relax')) return COLORS.musicGradients.chill;
  if (moodLower.includes('energy') || moodLower.includes('pump')) return COLORS.musicGradients.fire;
  if (moodLower.includes('happy') || moodLower.includes('upbeat')) return COLORS.musicGradients.sunset;
  if (moodLower.includes('sad') || moodLower.includes('melancholy')) return COLORS.musicGradients.ocean;
  if (moodLower.includes('romantic') || moodLower.includes('love')) return COLORS.musicGradients.dreamy;
  if (moodLower.includes('nature') || moodLower.includes('outdoor')) return COLORS.musicGradients.nature;
  if (moodLower.includes('night') || moodLower.includes('dark')) return COLORS.musicGradients.cosmic;
  if (moodLower.includes('warm') || moodLower.includes('cozy')) return COLORS.musicGradients.warm;
  
  return COLORS.musicGradients.electronic;
};

// Utility function to get random gradient
export const getRandomGradient = (): readonly [string, string] => {
  const gradients = Object.values(COLORS.musicGradients);
  const randomIndex = Math.floor(Math.random() * gradients.length);
  return gradients[randomIndex];
};

// Legacy exports for backward compatibility
export const LEGACY_COLORS = {
  WAVE_GRADIENT: COLORS.gradients.wave,
  BRIGHT_YELLOW: '#FFFF00',
  YELLOW_ORANGE: '#FFCC00',
  ORANGE: '#FF8000',
  DARK_ORANGE: '#FF6000',
  DEEP_ORANGE: '#FF4000',
} as const; 