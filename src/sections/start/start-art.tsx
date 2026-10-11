import styles from "./start.module.css";
export function StartArrow({ back = false }: { back?: boolean }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={back ? styles.backArrow : undefined}><path d="M4 12h16m-6-6 6 6-6 6" /></svg>;
}
export function StartCheck() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m5 12 4 4L19 6" /></svg>;
}
