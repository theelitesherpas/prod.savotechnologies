"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { markCandidateViewedAction } from "@/app/admin/(protected)/enquiries/career-actions";

/** A prefetched/SSR response is not a human view. Mark only after the visible page mounts. */
export function CandidateReadBoundary({ id, viewed, children }: { id: string; viewed: boolean; children: ReactNode }) {
  const router = useRouter(), started = useRef(false), [failed, setFailed] = useState(false);
  const mark = useCallback(() => {
    if (viewed || started.current || document.visibilityState !== "visible") return;
    started.current = true;
    void markCandidateViewedAction(id).then(result => {
      if (!result.ok) { started.current = false; setFailed(true); return; }
      router.refresh();
    }).catch(() => { started.current = false; setFailed(true); });
  }, [id, viewed, router]);
  useEffect(() => {
    if (viewed) return;
    mark();
    document.addEventListener("visibilitychange", mark);
    return () => document.removeEventListener("visibilitychange", mark);
  }, [viewed, mark]);
  return <div aria-busy={!viewed} data-candidate-read={viewed ? "ready" : failed ? "failed" : "pending"}>
    {!viewed ? <div className="mb-3 rounded-lg border border-border bg-surface p-3 text-sm" role={failed ? "alert" : "status"}>
      {failed ? <>Could not save the viewed status. <button type="button" onClick={() => { setFailed(false); mark(); }} className="font-semibold text-accent underline underline-offset-2">Retry</button></> : "Opening application and updating its viewed status…"}
    </div> : null}
    <div inert={!viewed}>{children}</div>
  </div>;
}

/** Refresh on returning from another tab/back navigation, without polling or storing candidate data. */
export function CandidateListRefresh() {
  const router = useRouter();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(timer); timer = setTimeout(() => router.refresh(), 150);
    };
    window.addEventListener("focus", refresh); window.addEventListener("popstate", refresh); document.addEventListener("visibilitychange", refresh);
    return () => { clearTimeout(timer); window.removeEventListener("focus", refresh); window.removeEventListener("popstate", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [router]);
  return null;
}
