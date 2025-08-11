// app/login.tsx
// Purpose: Polished Field Pro login screen (Paper UI, responsive, a11y)

import React, { useMemo, useState } from "react";
import { Platform, View } from "react-native";
import {
  Button,
  Card,
  HelperText,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useSnackbar } from "@/components/ui/SnackbarProvider";
import { Link, useRouter } from "expo-router";
import { useAuth, mapFriendlyErrorMessage } from "@/lib"; // single source

export default function LoginScreen() {
  const { signInWithEmail } = useAuth();
  const router = useRouter();
  const { show } = useSnackbar();
  const theme = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [reveal, setReveal] = useState(false);

  const trimmedEmail = useMemo(() => email.trim(), [email]);
  const emailInvalid = !!trimmedEmail && !/^\S+@\S+\.\S+$/.test(trimmedEmail);
  const canSubmit = !busy && !!trimmedEmail && !!password && !emailInvalid;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await signInWithEmail(trimmedEmail, password);
      router.replace("/profile");
    } catch (err: any) {
      show(mapFriendlyErrorMessage(err), { critical: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <Card
        mode="elevated"
        style={{
          width: "100%",
          maxWidth: 520,
          alignSelf: "center",
        }}
      >
        <Card.Content style={{ paddingTop: 8, gap: 12 }}>
          <Text variant="headlineMedium">Welcome back</Text>
          <Text style={{ opacity: 0.7, marginBottom: 4 }}>
            Sign in to continue your inspections.
          </Text>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            inputMode="email"
            returnKeyType="next"
          />
          <HelperText type="error" visible={emailInvalid}>
            Please enter a valid email.
          </HelperText>

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!reveal}
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
            right={
              <TextInput.Icon
                icon={reveal ? "eye-off" : "eye"}
                onPress={() => setReveal((r) => !r)}
                forceTextInputFocus={false}
                accessibilityLabel={reveal ? "Hide password" : "Show password"}
              />
            }
          />

          <Button
            mode="contained"
            onPress={onSubmit}
            loading={busy}
            disabled={!canSubmit}
            style={{ marginTop: 8 }}
            contentStyle={{ paddingVertical: 6 }}
          >
            Sign in
          </Button>

          <View style={{ alignItems: "center", marginTop: 12 }}>
            <Link href="/forgot-password" asChild>
              <Button mode="text">Forgot password?</Button>
            </Link>
          </View>

          <Text style={{ opacity: 0.7, marginTop: 4 }}>
            New here? You’ll need an invite link to register.
          </Text>
        </Card.Content>
      </Card>

      {/* Small visual nudge on web to avoid “floating in black” */}
      {Platform.OS === "web" && (
        <View style={{ height: 32 /* breathing room under card */ }} />
      )}
    </View>
  );
}
