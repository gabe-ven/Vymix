import React, { createContext, useContext, useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

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

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
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

  const signOut = async () => {
    try {
      await auth().signOut();
      setUser(null);
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