// lib/api/memberships.ts
// Purpose: Membership helpers (queried via RLS-scoped view/tables).

import { supabase } from '@/lib/auth/supabaseClient';
import type { Membership } from '@/lib/auth/types';

export async function listCurrentMemberships(): Promise<Membership[]> {
  const { data, error } = await supabase.from('current_memberships').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Membership[];
}
