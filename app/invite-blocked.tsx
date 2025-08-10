// app/invite-blocked.tsx
import React from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";

export default function InviteBlocked() {
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text variant="headlineSmall">Invite Invalid — User Logged In</Text>
      <Text>Sign out, then open the invite link again to continue.</Text>
      <Button
        mode="contained"
        onPress={async () => {
          await signOut();
          router.replace("/login");
        }}
      >
        Sign out
      </Button>
    </View>
  );
}
