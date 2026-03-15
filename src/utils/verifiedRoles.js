/**
 * Roles that display the blue verified tick on author bylines.
 * Update this list to add/remove eligible roles site-wide.
 */
export const VERIFIED_ROLES = new Set([
  'Founder and Editor-in-Chief',
  'Founder & Editor-in-Chief',
  'Editor-in-Chief',
  'Developer',
  'Journalist',
  'Senior Journalist',
  'Editor',
]);

/** Returns true if the given role string earns a verified tick. */
export function isVerifiedRole(role) {
  return !!role && VERIFIED_ROLES.has(role);
}
