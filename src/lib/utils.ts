/** Join class names, skipping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Deployment base path ("" locally; "/savo.v6" when hosted under a sub-path).
 * `next/link` applies it automatically; raw fetches, asset URLs and
 * window.location assignments must go through this helper instead.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix an internal path with the deployment base path. */
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
