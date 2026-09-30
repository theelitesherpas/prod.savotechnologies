"use client";

/**
 * Centralized analytics event layer - two sinks, one call:
 *  1. `window.dataLayer` (GA4 via GTM or gtag). Nothing is sent and no
 *     script is loaded unless NEXT_PUBLIC_GA_ID is set.
 *  2. The first-party collector (/api/analytics/collect) that powers the
 *     admin Analytics page - fire-and-forget, never throws.
 */

export type AnalyticsEvent =
  | "hero_cta_click"
  | "start_project_click"
  | "explore_work_click"
  | "nav_open"
  | "nav_link_click"
  | "service_open"
  | "role_open"
  | "role_filter_click"
  | "apply_click"
  | "hr_channel_click"
  | "ai_section_engagement"
  | "project_view_click"
  | "enquiry_form_start"
  | "enquiry_form_submit"
  | "enquiry_form_success"
  | "enquiry_form_error"
  | "footer_link_click"
  | "ask_savo_open"
  | "ask_savo_question"
  | "ask_savo_answered"
  | "ask_savo_handoff"
  | "ask_savo_human"
  | "ask_savo_minimize"
  | "ask_savo_minimize_outside"
  | "ask_savo_close"
  | "ask_savo_reset"
  | "ask_savo_book_call"
  | "ask_savo_whatsapp"
  | "ask_savo_mode_ai"
  | "ask_savo_mode_human"
  | "ask_savo_live_request"
  | "ask_savo_live_accepted"
  | "ask_savo_chat_ended";

type DataLayer = Record<string, unknown>[];

declare global {
  interface Window {
    dataLayer?: DataLayer;
  }
}

export function track(
  event: AnalyticsEvent,
  data: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...data });

  // Mirror into the first-party store (admin dashboard). Same-origin,
  // keepalive so it survives navigation; failures are silent.
  try {
    const body = JSON.stringify({
      type: "event",
      path: window.location.pathname,
      eventName: event,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/analytics/collect",
        new Blob([body], { type: "application/json" }),
      );
    } else {
      void fetch("/api/analytics/collect", {
        method: "POST",
        body,
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    // Analytics must never break UX.
  }
}
