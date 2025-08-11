// app/index.tsx
// Purpose: Root gate — resolve GuardState and route to /login, /invite-blocked, or /home.

import { useEffect, useRef, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import { getGuardState, type GuardState } from "@/lib";

export default function AppGate() {
  const router = useRouter();
  const [guard, setGuard] = useState<GuardState>({ kind: "loading" });
  const navigatedRef = useRef(false); // prevent double navigation (Strict Mode)

  useEffect(() => {
    let active = true;
    console.log("AppGate: start");

    // Safety net: if guard never resolves, default to /login
    const timeout = setTimeout(() => {
      if (!active || navigatedRef.current) return;
      console.warn("AppGate: timeout → /login");
      navigatedRef.current = true;
      router.replace("/login");
    }, 6000);

    (async () => {
      try {
        console.log("AppGate: calling getGuardState()");
        const g = await getGuardState();
        console.log("AppGate: guard =", g);
        if (!active || navigatedRef.current) return;

        setGuard(g);
        if (g.kind === "blocked") {
          const to = g.reason === "no-session" ? "/login" : "/invite-blocked";
          navigatedRef.current = true;
          router.replace(to);
        } else if (g.kind === "ready") {
          navigatedRef.current = true;
          router.replace("/home"); // maps to app/(tabs)/home.tsx
        }
      } catch (e) {
        console.error("AppGate: getGuardState error", e);
        if (active && !navigatedRef.current) {
          navigatedRef.current = true;
          router.replace("/login");
        }
      } finally {
        clearTimeout(timeout);
      }
    })();

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        gap: 12,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" />
      <Text>
        {guard.kind === "loading" ? "Checking session..." : "Redirecting..."}
      </Text>
    </View>
  );
}
