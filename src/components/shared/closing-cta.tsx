import type { ReactNode } from "react";
import s from "./closing-cta.module.css";

/** Shared visual close. Callers retain their copy, controls and conversion flow. */
export function ClosingCta({
  id,
  headingId,
  title,
  description,
  children,
}: {
  id?: string;
  headingId: string;
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={headingId} className={s.section} data-closing-cta>
      <div className={s.rail}>
        <div className={s.copy} data-closing-copy>
          <h2 id={headingId}>{title}</h2>
          <p>{description}</p>
        </div>
        <div className={s.actions} data-closing-actions>{children}</div>
      </div>
    </section>
  );
}

export function ClosingArrow() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16m-6-6 6 6-6 6" /></svg>;
}
