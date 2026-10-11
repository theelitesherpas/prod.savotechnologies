export function MeetingArrow({ back = false }: { back?: boolean }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={back ? { transform: "rotate(180deg)" } : undefined}><path d="M4 12h16m-6-6 6 6-6 6" /></svg>;
}
export function MeetingSymbol({ kind = "calendar" }: { kind?: "calendar" | "check" | "clock" | "closed" }) {
  return <svg aria-hidden="true" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{kind === "calendar" ? <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 11h18M8 15h2m4 0h2m-8 3h2" /></> : kind === "check" ? <><circle cx="12" cy="12" r="9" /><path d="m7 12 3 3 7-7" /></> : kind === "clock" ? <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></> : <><circle cx="12" cy="12" r="9" /><path d="m8 8 8 8m-8 0 8-8" /></>}</svg>;
}
