export function SwissArrow({ external = false }: { external?: boolean }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={external ? "M6 18 18 6M6 6h12v12" : "M4 12h16m-6-6 6 6-6 6"} /></svg>;
}
export function SwissLocation() {
  return <svg aria-hidden="true" width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M41 21c0 10-13 23-13 23S15 31 15 21a13 13 0 1 1 26 0Z" /><circle cx="28" cy="21" r="4.5" /><path d="M18 42c-6 1-10 3-10 5 0 3 9 5 20 5s20-2 20-5c0-2-4-4-10-5" /></svg>;
}
export function SwissPlus() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
}
