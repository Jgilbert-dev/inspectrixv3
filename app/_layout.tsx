// app/_layout.tsx
import React from "react";
import {
  ThemeProvider as PaperProvider,
  MD3LightTheme as Light,
  MD3DarkTheme as Dark,
} from "react-native-paper";
import { Slot } from "expo-router";
import { useColorScheme } from "react-native";
import { AuthProvider, useAuth } from "@/lib"; // single source
import { SnackbarProvider } from "@/components/ui/SnackbarProvider";

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? Dark : Light;

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <SnackbarProvider>
          <Slot />
        </SnackbarProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
