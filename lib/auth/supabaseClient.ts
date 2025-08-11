// lib/auth/supabaseClient.ts
// Purpose: Create a cross‑platform Supabase client for Expo/React Native + Web,
// with safe SSR behavior and native AsyncStorage persistence.

// Filename: lib/auth/supabaseClient.ts

import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const isWeb = Platform.OS === 'web';
const isSSR = typeof window === 'undefined';

// Only load AsyncStorage on native *and* on the client (not SSR).
let AsyncStorage: any | undefined;
if (!isWeb && !isSSR) {
  // Dynamic require prevents bundlers/SSR from evaluating the module on web/Node.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
}

// Adapter for native. On web/SSR leave undefined so supabase-js:
//  - uses localStorage on the client (web)
//  - uses no storage during SSR (Node)
const storageAdapter =
  AsyncStorage
    ? {
        getItem: (k: string) => AsyncStorage.getItem(k),
        setItem: (k: string, v: string) => AsyncStorage.setItem(k, v),
        removeItem: (k: string) => AsyncStorage.removeItem(k),
      }
    : undefined;

// During SSR there is no window/localStorage, so don't persist yet.
const persistSession = !isSSR;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Keep our project rule: no URL hash parsing in router
    detectSessionInUrl: false,

    // PKCE works fine for email/pass and future OAuth; safe to keep.
    flowType: 'pkce',

    // Platform-aware persistence
    storage: storageAdapter,
    persistSession,
    autoRefreshToken: true,
  },
});
