import { View, Text } from "react-native";
import "./globals.css";
import { Stack } from "expo-router";

const _layout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{ headerShown: false, title: "Login" }}
      />
    </Stack>
  );
};

export default _layout;
