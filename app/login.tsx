// app/login.tsx
import React, { useState } from "react";
import { View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { useAuth } from "@/lib/auth";
import { useSnackbar } from "@/components/ui/SnackbarProvider";
import { mapFriendlyErrorMessage } from "@/lib/utils";
import { Link, useRouter } from "expo-router";

export default function LoginScreen() {
  const { signInWithEmail } = useAuth();
  const router = useRouter();
  const { show } = useSnackbar();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    try {
      await signInWithEmail({ email, password });
      router.replace("/(tabs)");
    } catch (err: any) {
      show(mapFriendlyErrorMessage(err), { critical: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text variant="headlineMedium">Welcome back</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        mode="contained"
        onPress={onSubmit}
        loading={busy}
        disabled={busy}
      >
        Sign in
      </Button>
      <View style={{ height: 12 }} />
      <Link href="/forgot-password" asChild>
        <Button mode="text">Forgot password?</Button>
      </Link>
      <Text style={{ opacity: 0.7, marginTop: 8 }}>
        New here? You’ll need an invite link to register.
      </Text>
    </View>
  );
}
