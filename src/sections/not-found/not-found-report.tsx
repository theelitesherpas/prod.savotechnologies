"use client";

import { useEffect, useRef } from "react";
import { report404 } from "@/lib/report";

/** Keep existing best-effort reporting out of the static recovery interface. */
export function NotFoundReport() {
  const reported = useRef(false);
  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    report404();
  }, []);
  return null;
}
