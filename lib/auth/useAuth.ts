// lib/auth/useAuth.ts
// Purpose: Consumer hook for AuthContext with invariant check.

import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
