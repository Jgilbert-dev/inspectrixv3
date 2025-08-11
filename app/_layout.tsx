// app/_layout.tsx
// Purpose: Root app layout — provides Paper theme + router slot.

import { useMemo } from "react";
import { Slot } from "expo-router";
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = useMemo(
    () => (scheme === "dark" ? MD3DarkTheme : MD3LightTheme),
    [scheme]
  );

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Slot />
    </PaperProvider>
  );
}
