import React, { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../services/firebase";
import { GOOGLE_CLIENT_IDS } from "../env";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_CLIENT_IDS.ios,
    webClientId: GOOGLE_CLIENT_IDS.web,
  });

  const [userLoggedIn, setUserLoggedIn] = useState(false);

  useEffect(() => {
    if (response?.type === "success") {
      const { idToken } =
        (response.authentication as { idToken?: string }) || {};
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        signInWithCredential(auth, credential)
          .then(() => setUserLoggedIn(true))
          .catch((err) => console.error("Firebase sign-in error:", err));
      }
    }
  }, [response]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {userLoggedIn ? (
        <Text>Welcome! You are logged in.</Text>
      ) : (
        <Button title="Login with Google" onPress={() => promptAsync()} />
      )}
    </View>
  );
}
