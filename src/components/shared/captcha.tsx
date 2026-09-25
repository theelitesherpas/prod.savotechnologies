"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Progressive reCAPTCHA v2 — client half.
 *
 * useCaptcha() asks the server whether this IP still has free
 * submissions left; only then does the CaptchaGate load Google's
 * script and render the challenge (first-time visitors get zero
 * third-party JS — performance and privacy best practice). Forms
 * block submit until the token exists and send it as `captchaToken`.
 *
 * With no site key configured the gate reports required:false and
 * forms behave exactly as before.
 */

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (t: string) => void;
          "expired-callback": () => void;
          theme?: "light" | "dark";
        },
      ) => number;
      reset: (id?: number) => void;
    };
    __onRecaptchaLoaded?: () => void;
  }
}

const SCRIPT_ID = "recaptcha-v2-script";

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha?.render) return resolve();
    const wait = (fail: () => void) => {
      const check = setInterval(() => {
        if (window.grecaptcha?.render) {
          clearInterval(check);
          resolve();
        }
      }, 120);
      setTimeout(() => {
        clearInterval(check);
        fail();
      }, 8000);
    };
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      wait(() => reject(new Error("recaptcha load timeout")));
      return;
    }
    window.__onRecaptchaLoaded = () => resolve();
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = "https://www.google.com/recaptcha/api.js?onload=__onRecaptchaLoaded&render=explicit&hl=en";
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("recaptcha script failed"));
    document.head.appendChild(s);
  });
}

export type CaptchaState = {
  /** Server says this IP needs a challenge for its next submission. */
  required: boolean;
  /** Solved token — send as captchaToken with the submission. */
  token: string | null;
  /** Receive a solved token (used by the gate). */
  setToken: (t: string | null) => void;
  /** Clear the solved state (call after a failed server response). */
  reset: () => void;
  /** Re-check the gate (call after every successful submission). */
  refresh: () => void;
};

export function useCaptcha(): CaptchaState {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const [required, setRequired] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setToken(null);
    fetch("/api/captcha/required", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { required?: boolean }) => setRequired(Boolean(d.required) && Boolean(siteKey)))
      .catch(() => setRequired(false));
  }, [siteKey]);

  const reset = useCallback(() => {
    setToken(null);
    window.grecaptcha?.reset();
  }, []);

  // Initial gate check on mount (async — server state, not render state).
  useEffect(() => {
    let alive = true;
    fetch("/api/captcha/required", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { required?: boolean }) => {
        if (alive) setRequired(Boolean(d.required) && Boolean(siteKey));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [siteKey]);

  return { required, token, setToken, reset, refresh };
}

/** The challenge box — render inside any form; invisible unless required. */
export function CaptchaGate({ captcha, error }: { captcha: CaptchaState; error?: string | null }) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<number | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const [failed, setFailed] = useState(false);

  // Render the widget once the gate is required and the box is mounted.
  useEffect(() => {
    if (!captcha.required || !siteKey || widgetId.current !== null) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        const el = elRef.current;
        if (cancelled || !el || widgetId.current !== null || !window.grecaptcha?.render) return;
        widgetId.current = window.grecaptcha.render(el, {
          sitekey: siteKey,
          callback: (t) => captcha.setToken(t),
          "expired-callback": () => captcha.setToken(null),
          theme: "light",
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captcha.required, siteKey]);

  if (!captcha.required) return null;
  return (
    <div>
      <div ref={elRef} className="min-h-[78px]" aria-label="Human verification" />
      {failed ? (
        <p className="t-caption text-muted">Verification could not load — please reload the page.</p>
      ) : null}
      {error ? (
        <p role="alert" className="t-caption mt-1.5 text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Validation helper for submit handlers. */
export function captchaBlocked(captcha: CaptchaState): boolean {
  return captcha.required && !captcha.token;
}
