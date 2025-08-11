// lib/index.ts
// Purpose: Barrel exports for easy imports from the UI layer.

// ---- Auth Core ----
// If supabaseClient exports a *named* 'supabase', keep as named:
export { supabase } from "./auth/supabaseClient";
// If it was default, use: export { default as supabase } from "./auth/supabaseClient";

export * from "./auth/types";            // (types only — safe)
export * from "./auth/errorMapping";

// AuthProvider is almost always a default export — re-export it explicitly:
export { default as AuthProvider } from "./auth/AuthProvider";

// Hooks are typically named exports; keep star if it only has named:
export * from "./auth/useAuth";

// Guards are named exports; keep star:
export * from "./auth/guards";

// ---- API Layer ----
export * from "./api/invites";
export * from "./api/memberships";
export * from "./api/reports";
