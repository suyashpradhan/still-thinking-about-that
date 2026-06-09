/**
 * Pick an item from an array.
 *
 * With no `seed`, the choice is random. With a `seed` string the choice is
 * deterministic (same seed → same item), so a given memory always maps to the
 * same relief / wink line.
 */
export function pick<T>(arr: readonly T[], seed?: string): T {
  if (!seed) return arr[Math.floor(Math.random() * arr.length)];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return arr[Math.abs(h) % arr.length];
}
