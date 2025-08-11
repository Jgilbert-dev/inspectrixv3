// app/reset-password.tsx
// Purpose: Handle password reset using Supabase PKCE flow.
// Note: detectSessionInUrl=false, so we must exchange ?code=... for a session before updating password.

import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSnackbar } from "@/components/ui/SnackbarProvider";
import { useAuth, mapFriendlyErrorMessage, supabase } from "@/lib"; // supabase exported via our barrel

export default function ResetPassword() {
  // Supabase PKCE links land with ?code=... on the redirect URL
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { updatePassword } = useAuth();
  const { show } = useSnackbar();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  // Establish a session from the one-time code if needed
  useEffect(() => {
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session && code) {
          const { error } = await supabase.auth.exchangeCodeForSession(
            String(code)
          );
          if (error) {
            show(mapFriendlyErrorMessage(error), { critical: true });
            return;
          }
        }
        setReady(true);
      } catch (e) {
        show(mapFriendlyErrorMessage(e), { critical: true });
      }
    })();
  }, [code, show]);

  const onSubmit = async () => {
    if (!ready) return;
    setBusy(true);
    try {
      await updatePassword(password); // ✅ no access_token needed
      show("Password updated. Please sign in.", { critical: false });
      router.replace("/login");
    } catch (err: any) {
      show(mapFriendlyErrorMessage(err), { critical: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text variant="headlineSmall">Choose a new password</Text>
      <TextInput
        label="New password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        disabled={!ready}
      />
      <Button
        mode="contained"
        onPress={onSubmit}
        loading={busy}
        disabled={busy || !password || !ready}
      >
        Update password
      </Button>
    </View>
  );
}
