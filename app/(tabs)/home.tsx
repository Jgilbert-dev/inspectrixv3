// app/(tabs)/home.tsx
// Purpose: Simple Home screen for testing the AppGate redirect.
// Uses Paper theming to match the rest of the app.

import { View, StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib";

export default function HomeScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Welcome to Inspectrix
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        You have successfully reached the Home tab.
      </Text>

      <Button
        mode="contained"
        style={styles.button}
        onPress={async () => {
          await signOut();
          router.replace("/login");
        }}
      >
        Sign Out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    marginTop: 16,
  },
});
