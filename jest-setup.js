// Minimal Jest setup for React Native/Expo

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(() => Promise.resolve({ type: 'cancel' })),
  maybeCompleteAuthSession: jest.fn(),
}));

// Mock Firebase
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    onAuthStateChanged: jest.fn(() => jest.fn()),
    onIdTokenChanged: jest.fn(() => jest.fn()),
    signOut: jest.fn(() => Promise.resolve()),
    currentUser: null,
  }),
}));

// Mock environment variables
jest.mock('./env', () => ({
  SPOTIFY_CLIENT_ID: 'test-client-id',
  SPOTIFY_CLIENT_SECRET: 'test-client-secret',
  OPENAI_API_KEY: 'test-openai-key',
  GOOGLE_CLIENT_IDS: {
    ios: 'mock-ios-client-id',
    android: 'mock-android-client-id',
    web: 'mock-web-client-id',
  },
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      FIREBASE_API_KEY: 'mock-firebase-key',
      SPOTIFY_CLIENT_ID: 'mock-spotify-client-id',
      OPENAI_API_KEY: 'mock-openai-key',
    },
  },
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        FIREBASE_API_KEY: 'mock-firebase-key',
        SPOTIFY_CLIENT_ID: 'mock-spotify-client-id',
        OPENAI_API_KEY: 'mock-openai-key',
      },
    },
  },
}));

// Mock expo-auth-session
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'mock://redirect'),
  AuthSession: {
    makeRedirectUri: jest.fn(() => 'mock://redirect'),
  },
}));

// Mock expo-auth-session Google provider
jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: jest.fn(() => [
    { type: 'success' }, // request
    null, // response
    jest.fn(), // promptAsync
  ]),
}));

// Mock Google Sign-In - using the correct package name
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({
      user: { email: 'test@example.com', id: '123' },
      idToken: 'mock-token',
    })),
  },
}));
