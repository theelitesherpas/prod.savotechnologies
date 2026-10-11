"use client";

import { useSyncExternalStore } from "react";
import { ProfilePrinter } from "./profile-art";
import s from "./profile.module.css";

const subscribe = () => () => {};
/** Browser print dialog, not a fake downloadable/pre-generated PDF. */
export function PrintProfileButton({ secondary = false }: { secondary?: boolean }) {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  return <button type="button" className={secondary ? s.printSecondary : s.printPrimary} disabled={!ready} onClick={() => window.print()}>Print / save PDF<ProfilePrinter /></button>;
}
