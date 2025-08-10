// lib/auth/guards.ts
// Purpose: Non-UI guard helpers for route gating based on session AND membership presence.

import { supabase } from './supabaseClient';
import type { GuardState } from './types';

export async function hasAnyMembership(): Promise<boolean> {
  // Prefer an RPC if available for efficiency: select public.has_any_membership()
  const { data, error } = await supabase.rpc('has_any_membership');
  if (!error && typeof data === 'boolean') return data;

  // Fallback to view
  const { data: rows, error: err2 } = await supabase.from('current_memberships').select('id').limit(1);
  if (err2) return false;
  return (rows?.length ?? 0) > 0;
}

export async function getGuardState(): Promise<GuardState> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return { kind: 'blocked', reason: 'no-session' };
  const ok = await hasAnyMembership();
  if (!ok) return { kind: 'blocked', reason: 'no-membership' };
  return { kind: 'ready' };
}
