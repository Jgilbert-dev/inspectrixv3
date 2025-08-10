// lib/auth/errorMapping.ts
// Purpose: Map backend/RPC error substrings 1:1 to friendly UI messages. UI can import this mapping.

export const ERROR_COPY: Record<string, string> = {
  not_admin: 'You must be a contractor admin to perform this action.',
  invalid_role: 'Invalid role. Choose admin or user.',
  invalid_max_uses: 'Invalid max uses. Must be at least 1.',
  ttl_out_of_range: 'Expiry must be between 60 and 1440 minutes.',
  not_authenticated: 'Please sign in to continue.',
  invalid_token: 'This invite link is invalid.',
  expired: 'This invite has expired.',
  already_used: 'This invite has already been fully used.',
  email_mismatch: 'This invite is restricted to a different email address.',
};

export function mapFriendlyErrorMessage(error: unknown): string {
  const raw = String((error as any)?.message ?? error ?? '');
  const hit = Object.keys(ERROR_COPY).find((k) => raw.includes(k));
  return hit ? ERROR_COPY[hit] : 'Something went wrong. Please try again.';
}
