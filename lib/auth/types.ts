// lib/auth/types.ts
// Purpose: Shared types for auth, memberships, invites, and guards.

export type Role = 'owner' | 'admin' | 'user';
export type MembershipStatus = 'active' | 'inactive' | 'pending' | 'revoked';

export type Membership = {
  id: string;
  user_id: string;
  contractor_id: string;
  role: Role;
  status: MembershipStatus;
  created_at: string;
};

export type InviteCreateInput = {
  contractorId: string;
  invitedEmail?: string;
  role: Exclude<Role, 'owner'>; // only 'admin' | 'user'
  ttlMinutes: number; // 60..1440
  maxUses: number;    // >= 1
  notes?: string;
};

export type InviteCreateResult = {
  id: string;
  token: string;
  expires_at: string;
};

export type AcceptInviteResult = {
  contractor_id: string;
  role: Exclude<Role, 'owner'> | 'owner';
};

export type GuardState =
  | { kind: 'loading' }
  | { kind: 'blocked'; reason: 'no-session' | 'no-membership' }
  | { kind: 'ready' };
