import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* White status bar icons for dark screens */}
      <StatusBar style="light" />

      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </GestureHandlerRootView>
  );
}

export const unstable_settings = {
  anchor: "(tabs)",
};
