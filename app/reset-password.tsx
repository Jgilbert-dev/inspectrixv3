// app/reset-password.tsx
import React, { useState } from "react";
import { View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSnackbar } from "@/components/ui/SnackbarProvider";
import { useAuth } from "@/lib/auth";
import { mapFriendlyErrorMessage } from "@/lib/utils";

export default function ResetPassword() {
  const { access_token } = useLocalSearchParams<{ access_token?: string }>(); // Supabase sends tokens like this on web
  const { updatePassword } = useAuth();
  const { show } = useSnackbar();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    try {
      await updatePassword({ access_token, newPassword: password });
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
      />
      <Button
        mode="contained"
        onPress={onSubmit}
        loading={busy}
        disabled={busy || !password}
      >
        Update password
      </Button>
    </View>
  );
}
