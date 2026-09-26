"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Progressive reCAPTCHA v2 - client half.
 *
 * useCaptcha() asks the server whether this IP still has free
 * submissions left; only then does the CaptchaGate load Google's
 * script and render the challenge (first-time visitors get zero
 * third-party JS - performance and privacy best practice). Forms
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
      }, 10000);
    };
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      wait(() => reject(new Error("reCAPTCHA load timeout")));
      return;
    }
    window.__onRecaptchaLoaded = () => resolve();
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = "https://www.google.com/recaptcha/api.js?onload=__onRecaptchaLoaded&render=explicit&hl=en";
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("reCAPTCHA script failed to load"));
    document.head.appendChild(s);
  });
}

export type CaptchaState = {
  /** Server says this IP needs a challenge for its next submission. */
  required: boolean;
  /** Solved token - send as captchaToken with the submission. */
  token: string | null;
  /** Receive a solved token (used by the gate). */
  setToken: (t: string | null) => void;
  /** Clear the solved state (call after a failed server response). */
  reset: () => void;
  /** Re-check the gate (call after every successful submission). */
  refresh: () => void;
};

export function useCaptcha(portal?: "admin" | "employee" | "client"): CaptchaState {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const checkUrl = portal ? `/api/captcha/required?portal=${portal}` : "/api/captcha/required";
  const [required, setRequired] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setToken(null);
    fetch(checkUrl, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { required?: boolean }) => setRequired(Boolean(d.required) && Boolean(siteKey)))
      .catch(() => setRequired(false));
  }, [checkUrl, siteKey]);

  const reset = useCallback(() => {
    setToken(null);
    window.grecaptcha?.reset();
  }, []);

  // Initial gate check on mount (async - server state, not render state).
  useEffect(() => {
    let alive = true;
    fetch(checkUrl, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { required?: boolean }) => {
        if (alive) setRequired(Boolean(d.required) && Boolean(siteKey));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [checkUrl, siteKey]);

  return { required, token, setToken, reset, refresh };
}

/** The challenge box - render inside any form; invisible unless required. */
export function CaptchaGate({ captcha, error }: { captcha: CaptchaState; error?: string | null }) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<number | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  // Render the widget once the gate is required and the box is mounted.
  useEffect(() => {
    if (!captcha.required || !siteKey || widgetId.current !== null) return;
    let cancelled = false;
    setStatus("loading");
    loadScript()
      .then(() => {
        // Wait for the DOM element to be available
        const tryRender = (attempts: number) => {
          if (cancelled) return;
          const el = elRef.current;
          if (!el && attempts < 20) {
            requestAnimationFrame(() => tryRender(attempts + 1));
            return;
          }
          if (!el || widgetId.current !== null || !window.grecaptcha?.render) {
            if (attempts >= 20) setStatus("failed");
            return;
          }
          widgetId.current = window.grecaptcha.render(el, {
            sitekey: siteKey,
            callback: (t) => captcha.setToken(t),
            "expired-callback": () => captcha.setToken(null),
            theme: "light",
          });
          setStatus("ready");
        };
        tryRender(0);
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captcha.required, siteKey]);

  if (!captcha.required) return null;

  return (
    <div>
      <div
        ref={elRef}
        className="min-h-[78px] py-1"
        aria-label="Human verification"
        data-recaptcha-widget={siteKey ? "loaded" : "no-key"}
      />
      {status === "loading" ? (
        <p className="text-[0.75rem] text-muted">Loading verification...</p>
      ) : null}
      {status === "failed" ? (
        <p className="t-caption text-error">
          Verification could not load - please refresh the page.
        </p>
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
