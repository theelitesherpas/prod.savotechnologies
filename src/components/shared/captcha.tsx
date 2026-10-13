"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Google reCAPTCHA v2 - client half.
 *
 * Public enquiry/application forms ask the server whether verification
 * is configured and require a token before submission. The callback
 * form delays rendering until a phone number is entered. Client/employee
 * sign-ins require verification from the first attempt and fail closed if
 * unavailable. Admin retains its failed-attempt threshold.
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
          "error-callback"?: () => void;
          theme?: "light" | "dark";
          size?: "normal" | "compact";
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
    s.src =
      "https://www.google.com/recaptcha/api.js?onload=__onRecaptchaLoaded&render=explicit&hl=en";
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("reCAPTCHA script failed to load"));
    document.head.appendChild(s);
  });
}

export type CaptchaState = {
  /** Server says this flow requires a challenge. */
  required: boolean;
  /** Mandatory access cannot continue while configuration/status is unavailable. */
  unavailable?: boolean;
  /** Solved token - send as captchaToken with the submission. */
  token: string | null;
  /** Receive a solved token (used by the gate). */
  setToken: (t: string | null) => void;
  /** Clear the solved state (call after a failed server response). */
  reset: () => void;
  /** Re-check the gate (call after every successful submission). */
  refresh: () => void;
};

export function useCaptcha(
  portal?: "admin" | "employee" | "client",
): CaptchaState {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const checkUrl = portal
    ? `/api/captcha/required?portal=${portal}`
    : "/api/captcha/required";
  const mandatory = portal === "client" || portal === "employee";
  const [required, setRequired] = useState(
    () => mandatory || (!portal && Boolean(siteKey)),
  );
  const [unavailable, setUnavailable] = useState(() => mandatory && !siteKey);
  const [token, setToken] = useState<string | null>(null);

  const apply = useCallback(
    (d: {
      required?: boolean;
      configured?: boolean;
      unavailable?: boolean;
    }) => {
      setRequired(mandatory || (Boolean(d.required) && Boolean(siteKey)));
      setUnavailable(
        mandatory &&
          (!siteKey || d.configured === false || Boolean(d.unavailable)),
      );
    },
    [mandatory, siteKey],
  );
  const refresh = useCallback(() => {
    setToken(null);
    fetch(checkUrl, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Verification status unavailable");
        return r.json();
      })
      .then(apply)
      .catch(() => {
        setRequired(mandatory);
        setUnavailable(mandatory);
      });
  }, [apply, checkUrl, mandatory]);

  const reset = useCallback(() => {
    setToken(null);
    window.grecaptcha?.reset();
  }, []);

  // Initial gate check on mount (async - server state, not render state).
  useEffect(() => {
    let alive = true;
    fetch(checkUrl, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Verification status unavailable");
        return r.json();
      })
      .then((d) => {
        if (alive) apply(d);
      })
      .catch(() => {
        if (alive && mandatory) setUnavailable(true);
      });
    return () => {
      alive = false;
    };
  }, [apply, checkUrl, mandatory]);

  return { required, unavailable, token, setToken, reset, refresh };
}

/** The challenge box - render inside any form; invisible unless required. */
export function CaptchaGate({
  captcha,
  error,
  id,
}: {
  captcha: CaptchaState;
  error?: string | null;
  id?: string;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<number | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading",
  );
  const [expired, setExpired] = useState(false);

  // Render the widget once the gate is required and the box is mounted.
  useEffect(() => {
    if (
      !captcha.required ||
      captcha.unavailable ||
      !siteKey ||
      widgetId.current !== null
    )
      return;
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
          const size = id && el.clientWidth < 304 ? "compact" : "normal";
          el.dataset.recaptchaSize = size;
          widgetId.current = window.grecaptcha.render(el, {
            sitekey: siteKey,
            size,
            callback: (t) => {
              setExpired(false);
              captcha.setToken(t);
            },
            "expired-callback": () => {
              setExpired(true);
              captcha.setToken(null);
            },
            "error-callback": () => {
              setStatus("failed");
              captcha.setToken(null);
            },
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
  }, [captcha.required, captcha.unavailable, siteKey]);

  if (captcha.unavailable)
    return (
      <p role="alert" className="t-caption text-error">
        Human verification is temporarily unavailable. Please refresh the page
        or contact your Savo team for help.
      </p>
    );
  if (!captcha.required) return null;

  return (
    <div>
      <p className="mb-2 text-[0.8125rem] font-medium">Human verification</p>
      <div
        ref={elRef}
        id={id}
        role="group"
        tabIndex={-1}
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
      {error || expired ? (
        <p role="alert" className="t-caption mt-1.5 text-error">
          {error || "Verification expired. Please complete it again."}
        </p>
      ) : null}
    </div>
  );
}

/** Validation helper for submit handlers. */
export function captchaBlocked(captcha: CaptchaState): boolean {
  return Boolean(captcha.unavailable) || (captcha.required && !captcha.token);
}
