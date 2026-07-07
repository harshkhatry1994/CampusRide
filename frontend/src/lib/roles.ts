/**
 * Single source of truth for admin role determination.
 * All authorization checks in the app must use these helpers.
 * Never hardcode "admin" or "super_admin" strings elsewhere.
 */

export const ADMIN_ROLES = ["admin", "super_admin"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];
export type AppRole = AdminRole | "user";

/** Returns true for both "admin" and "super_admin". */
export function isAdminRole(role: string | null | undefined): boolean {
  return ADMIN_ROLES.includes(role as AdminRole);
}

/** Returns the redirect destination based on role. */
export function getRedirectPath(
  role: string | null | undefined,
  profileComplete: boolean
): "/admin" | "/complete-profile" | "/dashboard" {
  if (isAdminRole(role)) return "/admin";
  if (!profileComplete) return "/complete-profile";
  return "/dashboard";
}
