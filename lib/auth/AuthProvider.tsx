// lib/auth/AuthProvider.tsx
// Purpose: Provide auth/session state and membership awareness to the app without coupling to UI pages.

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/auth/supabaseClient";
import type { Membership } from "./types";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  memberships: Membership[] | null;
  refresh: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ user: User }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ user: User }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>; // ✅ added
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<Membership[] | null>(null);

  const loadSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session ?? null);
    setUser(data.session?.user ?? null);
  }, []);

  const loadMemberships = useCallback(async () => {
    if (!user) {
      setMemberships(null);
      return;
    }
    // Assumes `public.current_memberships` view exposed via RLS for the current user
    const { data, error } = await supabase
      .from("current_memberships")
      .select("*");
    if (error) {
      setMemberships([]);
      return;
    }
    setMemberships((data ?? []) as Membership[]);
  }, [user]);

  const refresh = useCallback(async () => {
    await loadSession();
    await loadMemberships();
  }, [loadSession, loadMemberships]);

  // subscribe to auth changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadSession();
      if (!mounted) return;
      await loadMemberships();
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      await loadSession();
      await loadMemberships();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadSession, loadMemberships]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.user) throw error ?? new Error("signIn failed");
      await refresh();
      return { user: data.user };
    },
    [refresh]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      // No email verification per spec
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error || !data.user) throw error ?? new Error("signUp failed");
      await refresh();
      return { user: data.user };
    },
    [refresh]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await refresh();
  }, [refresh]);

  // ✅ Added: updatePassword
  const updatePassword = useCallback(
    async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      await refresh();
    },
    [refresh]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      memberships,
      refresh,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      updatePassword, // ✅ now provided
    }),
    [
      user,
      session,
      memberships,
      refresh,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      updatePassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
