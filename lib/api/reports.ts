// lib/api/reports.ts
// Purpose: Minimal stubs for reports CRUD (RLS by contractor_id will govern access). Extend as needed.

import { supabase } from '@/lib/auth/supabaseClient';

export async function createDraftReport(params: {
  contractor_id: string;
  title?: string;
  job_number?: string;
  equipment_ref?: string;
}) {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      contractor_id: params.contractor_id,
      status: 'draft',
      title: params.title ?? null,
      job_number: params.job_number ?? null,
      equipment_ref: params.equipment_ref ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function listReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('id, contractor_id, status, title, job_number, equipment_ref, created_at, updated_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
