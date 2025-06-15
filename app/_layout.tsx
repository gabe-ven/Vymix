import { View, Text } from "react-native";
import React from "react";
import "./globals.css";
import { Stack } from "expo-router";

const _layout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false, title: "Home" }}
      />
    </Stack>
  );
};

export default _layout;
