// lib/api/invites.ts
// Purpose: RPC wrappers for creating and accepting invites. Enforces contract described in the handoff.

// lib/auth/AuthProvider.tsx
// lib/api/invites.ts
import { supabase } from '../auth/supabaseClient';
import type { AcceptInviteResult, InviteCreateInput, InviteCreateResult } from '@/lib/auth/types';

export async function createInvite(input: InviteCreateInput): Promise<InviteCreateResult> {
  const { contractorId, invitedEmail, role, ttlMinutes, maxUses, notes } = input;

  const { data, error } = await supabase.rpc('create_invite', {
    p_contractor_id: contractorId,
    p_invited_email: invitedEmail ?? null,
    p_role: role,
    p_ttl_minutes: ttlMinutes,
    p_max_uses: maxUses,
    p_notes: notes ?? null,
  });

  if (error) throw error;
  return data as InviteCreateResult;
}

export async function acceptInvite(token: string): Promise<AcceptInviteResult> {
  const { data, error } = await supabase.rpc('accept_invite', { p_token: token });
  if (error) throw error;
  return data as AcceptInviteResult;
}
