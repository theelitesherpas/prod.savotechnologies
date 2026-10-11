/** Public discovery is never a substitute for authentication. Fail closed on malformed paths. */
export function isPrivateSurface(pathname: string): boolean {
  let path: string;
  try {
    path = decodeURIComponent(pathname).replace(/\/+/g, "/");
  } catch {
    return true;
  }
  return /^\/(?:_next|api|admin|portal|employee-portal|meeting|unsubscribe)(?:\/|$)/.test(path)
    || /^\/(?:insights|case-studies)\/preview(?:\/|$)/.test(path);
}

/** Response-only publication/cache guard; the public case-image API keeps its own policy. */
export function isSensitiveResponse(pathname: string): boolean {
  return isPrivateSurface(pathname) && !/^\/api\/cs-img\/?$/.test(pathname);
}
