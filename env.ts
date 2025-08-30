import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra || {};

export const FIREBASE_CONFIG = {
  apiKey: extra.FIREBASE_API_KEY,
  authDomain: extra.FIREBASE_AUTH_DOMAIN,
  projectId: extra.FIREBASE_PROJECT_ID,
  storageBucket: extra.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: extra.FIREBASE_MESSAGING_SENDER_ID,
  appId: extra.FIREBASE_APP_ID,
  measurementId: extra.FIREBASE_MEASUREMENT_ID,
};

export const GOOGLE_CLIENT_IDS: { ios?: string; android?: string; web?: string } = {
  ios: extra.GOOGLE_IOS_CLIENT_ID,
  android: extra.GOOGLE_ANDROID_CLIENT_ID,
  web: extra.GOOGLE_WEB_CLIENT_ID,
};

export const GOOGLE_API_KEY = extra.GOOGLE_API_KEY;
export const SPOTIFY_CLIENT_ID = extra.SPOTIFY_CLIENT_ID;
export const SPOTIFY_CLIENT_SECRET = extra.SPOTIFY_CLIENT_SECRET;
export const OPENAI_API_KEY = extra.OPENAI_API_KEY;
