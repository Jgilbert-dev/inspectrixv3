// lib/index.ts
// Purpose: Barrel exports for easy imports from the UI layer.

export * from './auth/supabaseClient';
export * from './auth/types';
export * from './auth/errorMapping';
export * from './auth/AuthProvider';
export * from './auth/useAuth';
export * from './auth/guards';

export * from './api/invites';
export * from './api/memberships';
export * from './api/reports';
