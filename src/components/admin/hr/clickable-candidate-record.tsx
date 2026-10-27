"use client";

import type { MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";

const INTERACTIVE_TARGETS = "a, button, input, select, textarea, summary, [role='button'], [data-row-click-ignore]";

function useCandidateRecordNavigation(href: string) {
  const router = useRouter();

  return (event: MouseEvent<HTMLElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.target instanceof Element && event.target.closest(INTERACTIVE_TARGETS)) return;
    router.push(href);
  };
}

type CandidateRecordProps = { href: string; children: ReactNode; className?: string; viewState: "not_viewed" | "viewed" };

export function ClickableCandidateRow({ href, children, className, viewState }: CandidateRecordProps) {
  const onClick = useCandidateRecordNavigation(href);
  return <tr data-clickable-record="true" data-view-state={viewState} className={className} onClick={onClick}>{children}</tr>;
}

export function ClickableCandidateCard({ href, children, className, viewState }: CandidateRecordProps) {
  const onClick = useCandidateRecordNavigation(href);
  return <article data-clickable-record="true" data-view-state={viewState} className={className} onClick={onClick}>{children}</article>;
}
