// app/invite.tsx
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth, mapFriendlyErrorMessage } from "@/lib"; // single source
import { useSnackbar } from "@/components/ui/SnackbarProvider";

export default function InviteAcceptScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { acceptInvite, session } = useAuth() as any;
  const { show } = useSnackbar();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error" | "ok">("loading");

  useEffect(() => {
    // Must be signed out to accept an invite
    if (session) {
      router.replace("/invite-blocked");
      return;
    }
    (async () => {
      if (!token) {
        setStatus("error");
        show("Invite token missing.", { critical: true });
        return;
      }
      try {
        await acceptInvite(token);
        setStatus("ok");
        router.replace("/profile");
      } catch (err: any) {
        setStatus("error");
        show(mapFriendlyErrorMessage(err), { critical: true, timeoutMs: 7000 });
      }
    })();
  }, [token, session, router, acceptInvite, show]);

  if (status === "loading") {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <ActivityIndicator />
        <Text style={{ marginTop: 12 }}>Validating your invite…</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text variant="headlineSmall">Invite</Text>
      <Text>
        Something went wrong. If your link expired, request a new invite.
      </Text>
      <Button mode="outlined" onPress={() => router.replace("/login")}>
        Back to login
      </Button>
    </View>
  );
}
