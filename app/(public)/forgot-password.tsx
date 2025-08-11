// app/forgot-password.tsx
import React, { useState } from "react";
import { View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { useSnackbar } from "@/components/ui/SnackbarProvider";
import { useAuth, mapFriendlyErrorMessage } from "@/lib"; // single source

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const { requestPasswordReset } = useAuth();
  const { show } = useSnackbar();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await requestPasswordReset({ email });
      show("Check your email for a reset link.", { critical: false });
    } catch (err: any) {
      show(mapFriendlyErrorMessage(err), { critical: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text variant="headlineSmall">Reset your password</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Button mode="contained" onPress={submit} loading={busy} disabled={busy}>
        Send reset link
      </Button>
    </View>
  );
}
