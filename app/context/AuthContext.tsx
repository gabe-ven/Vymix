import React, { createContext, useContext, useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useRouter, useSegments } from 'expo-router';
import { auth as webAuth } from '../../services/firebase';

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

// This hook will protect the route access based on user authentication.
function useProtectedRoute(user: FirebaseAuthTypes.User | null) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to the login page if the user is not signed in
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect away from the login page if the user is signed in
      router.replace('/(tabs)/create');
    }
  }, [user, segments]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    // Set up token refresh listener
    const tokenRefreshUnsubscribe = auth().onIdTokenChanged(async (user) => {
      if (user) {
        try {
          // Force token refresh if needed
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

  // Use the protected route hook
  useProtectedRoute(user);

  const signOut = async () => {
    try {
      console.log('Starting sign out process...');
      // Sign out from both Firebase instances
      console.log('Signing out from React Native Firebase...');
      await auth().signOut();
      console.log('React Native Firebase sign out successful');
      
      console.log('Signing out from Web Firebase...');
      await webAuth.signOut();
      console.log('Web Firebase sign out successful');
      
      console.log('Sign out successful, updating state...');
      // Force a state update
      setUser(null);
      
      console.log('Navigating to login...');
      // Navigate to login
      router.replace('/(auth)/login');
      console.log('Navigation complete');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error; // Re-throw the error so it can be caught by the component
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