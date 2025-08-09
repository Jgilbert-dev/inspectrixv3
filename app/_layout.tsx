// app/_layout.tsx (Root)
import { PaperProvider } from "react-native-paper";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <PaperProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}
