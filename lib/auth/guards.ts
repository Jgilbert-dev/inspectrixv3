// lib/auth/guards.ts
// Purpose: Non-UI guard helpers for route gating based on session AND membership presence.

// ⚠️ Use relative import inside lib to avoid alias/circular issues.
import { supabase } from "./supabaseClient";
import type { GuardState } from "./types";
import type { PostgrestResponse, PostgrestSingleResponse } from "@supabase/supabase-js";

const TAG = "[guards]";

function withTimeout<T>(p: Promise<T>, ms = 6000, label = "op"): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

// Helpful in dev: if env or client is misconfigured, SHORT-CIRCUIT cleanly
function supabaseReady(): boolean {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

export async function hasAnyMembership(): Promise<boolean> {
  console.log(`${TAG} hasAnyMembership: start`);

  // RPC first (scalar boolean)
  try {
    const { data, error } = await withTimeout<PostgrestSingleResponse<boolean>>(
      supabase.rpc("has_any_membership"),
      6000,
      "rpc(has_any_membership)",
    );
    if (error) console.warn(`${TAG} RPC error:`, error.message);
    if (typeof data === "boolean") return data;
  } catch (e: any) {
    console.warn(`${TAG} RPC threw:`, e?.message ?? e);
  }

  // Fallback to view
  try {
    const { data: rows, error: err2 } = await withTimeout<PostgrestResponse<{ id: string }>>(
      supabase.from("current_memberships").select("id").limit(1),
      6000,
      "select(current_memberships)",
    );
    if (err2) {
      console.warn(`${TAG} current_memberships error:`, err2.message);
      return false;
    }
    const ok = (rows?.length ?? 0) > 0;
    console.log(`${TAG} current_memberships →`, ok ? "FOUND" : "NONE");
    return ok;
  } catch (e: any) {
    console.warn(`${TAG} current_memberships threw:`, e?.message ?? e);
    return false;
  }
}

export async function getGuardState(): Promise<GuardState> {
  console.log(`${TAG} getGuardState: start → checking session`);

  // Dev safety: if Supabase isn’t configured, treat as signed out
  if (!supabaseReady()) {
    console.warn(`${TAG} Supabase not configured → treating as no-session`);
    return { kind: "blocked", reason: "no-session" };
  }

  try {
    // getSession() returns { data: { session }, error }
    const { data, error } = await withTimeout(
      supabase.auth.getSession(),
      6000,
      "auth.getSession",
    );

    if (error) console.warn(`${TAG} auth.getSession error:`, error.message);

    const session = data?.session ?? null;
    console.log(`${TAG} session:`, session ? "PRESENT" : "ABSENT");
    if (!session) return { kind: "blocked", reason: "no-session" };

    console.log(`${TAG} checking membership…`);
    const ok = await hasAnyMembership();
    console.log(`${TAG} membership:`, ok ? "YES" : "NO");
    if (!ok) return { kind: "blocked", reason: "no-membership" };

    console.log(`${TAG} final: READY`);
    return { kind: "ready" };
  } catch (e: any) {
    console.error(`${TAG} getGuardState threw:`, e?.message ?? e);
    return { kind: "blocked", reason: "no-session" };
  }
}
