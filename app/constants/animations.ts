// Animation timing constants
export const ANIMATION = {
  DURATION: {
    FAST: 400,
    NORMAL: 800,
    SLOW: 1000,
  },
  DELAY: {
    CARD: 0,
    BUTTONS: 200,
    LIST: 400,
  },
  SPRING: {
    TENSION: 80,
    DAMPING: 8,
  },
  SCROLL: {
    FADE_RANGE: [0, 400],
    BUTTONS_FADE_RANGE: [200, 400],
    SONGS_FADE_RANGE: [600, 800],
    FLOATING_TITLE_RANGE: [250, 350],
  },
  TRANSFORM: {
    START_TRANSLATE_Y: 50,
    SCALE_DOWN: 0.8,
    ROTATE_X: -15,
    PERSPECTIVE: 1000,
  },
  SHADOW: {
    OPACITY: {
      START: 0.4,
      END: 0.1,
    },
    RADIUS: {
      START: 20,
      END: 5,
    },
    ELEVATION: {
      START: 15,
      END: 2,
    },
  },
} as const;

// Song fade animation constants
export const SONG_ANIMATION = {
  START_FADE: 500,
  FADE_SPACING: 80,
  FADE_DURATION: 200,
  SCALE_DOWN: 0.7,
} as const; 