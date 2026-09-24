"use client";

/**
 * Centralized analytics event layer.
 * Events are pushed to `window.dataLayer` (GA4 via GTM or gtag).
 * Nothing is sent and no script is loaded unless NEXT_PUBLIC_GA_ID is set.
 */

export type AnalyticsEvent =
  | "hero_cta_click"
  | "start_project_click"
  | "explore_work_click"
  | "nav_open"
  | "nav_link_click"
  | "service_open"
  | "ai_section_engagement"
  | "project_view_click"
  | "enquiry_form_start"
  | "enquiry_form_submit"
  | "enquiry_form_success"
  | "enquiry_form_error"
  | "footer_link_click";

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
}
