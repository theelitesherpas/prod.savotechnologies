export function IndoreArrow({ external = false }: { external?: boolean }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d={external ? "M6 18 18 6M6 6h12v12" : "M4 12h16m-6-6 6 6-6 6"} /></svg>;
}
export function IndorePlus() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
}
/** A location symbol, not a geographic pin, office rendering or map. */
export function IndoreLocation() {
  return <svg aria-hidden="true" width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2"><path d="M47 25c0 12-15 25-15 25S17 37 17 25a15 15 0 1 1 30 0Z" /><circle cx="32" cy="25" r="5" /><path d="M21 48c-7 1-11 3-11 6 0 4 10 7 22 7s22-3 22-7c0-3-4-5-11-6" /></svg>;
}
