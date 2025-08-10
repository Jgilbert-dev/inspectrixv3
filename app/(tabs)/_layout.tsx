// app/(tabs)/_layout.tsx
import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { ActivityIndicator } from "react-native-paper";
import { View } from "react-native";
import { getGuardState } from "@/lib/guards";

export default function TabsLayout() {
  const router = useRouter();
  const [state, setState] = React.useState<{
    kind: "loading" | "blocked" | "ready";
    reason?: string;
  }>({ kind: "loading" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const g = await getGuardState();
      if (!mounted) return;
      if ("loading" in g) setState({ kind: "loading" });
      else if ("blocked" in g) {
        setState({ kind: "blocked", reason: g.blocked });
        router.replace("/login");
      } else {
        setState({ kind: "ready" });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (state.kind === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="index" options={{ title: "Reports" }} />
      <Tabs.Screen name="create" options={{ title: "Create Report" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
