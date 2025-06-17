import React, { createContext, useContext, useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useRouter, useSegments } from 'expo-router';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

// This hook can be used to access the user info.
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
      setIsInitialized(true);
    });

    const tokenRefreshUnsubscribe = auth().onIdTokenChanged(async (user) => {
      if (user) {
        try {
          await user.getIdToken(true);
        } catch (error) {
          console.error('Error refreshing token:', error);
        }
      }
    });

    return () => {
      unsubscribe();
      tokenRefreshUnsubscribe();
    };
  }, []);

  // Handle protected routes
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to the login page if the user is not signed in
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect away from the login page if the user is signed in
      router.replace('/(tabs)/create');
    }
  }, [user, segments, isInitialized]);

  const signOut = async () => {
    try {
      await auth().signOut();
      setUser(null);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 