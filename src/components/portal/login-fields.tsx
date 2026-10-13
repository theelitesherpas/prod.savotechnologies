"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { CaptchaGate, type CaptchaState } from "@/components/shared/captcha";
import { PortalIcon } from "./workspace-ui";
import styles from "./portal.module.css";

export function PortalLoginFields({
  kind,
  captcha,
  captchaError,
}: {
  kind: "client" | "employee";
  captcha: CaptchaState;
  captchaError: string | null;
}) {
  const { pending } = useFormStatus();
  const [visible, setVisible] = useState(false);
  const prefix = kind === "employee" ? "emp" : "pt";
  return (
    <>
      <div className={styles.loginField}>
        <label htmlFor={`${prefix}-email`}>
          {kind === "employee" ? "Work email" : "Email address"}
        </label>
        <input
          id={`${prefix}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          required
          maxLength={120}
          spellCheck={false}
          autoCapitalize="none"
          disabled={pending}
        />
      </div>
      <div className={styles.loginField}>
        <label htmlFor={`${prefix}-password`}>Password</label>
        <div className={styles.passwordWrap}>
          <input
            id={`${prefix}-password`}
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={128}
            disabled={pending}
          />
          <button
            className={styles.passwordToggle}
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-controls={`${prefix}-password`}
            disabled={pending}
            onClick={() => setVisible(!visible)}
          >
            <PortalIcon name={visible ? "eye-off" : "eye"} />
          </button>
        </div>
      </div>
      <CaptchaGate
        id={`${prefix}-captcha`}
        captcha={captcha}
        error={captchaError}
      />
      {captcha.token ? (
        <input type="hidden" name="captchaToken" value={captcha.token} />
      ) : null}
      <button
        className={styles.primary}
        type="submit"
        disabled={pending || captcha.unavailable}
      >
        {pending
          ? "Signing in…"
          : kind === "employee"
            ? "Sign in to employee portal"
            : "Sign in to your workspace"}
        <PortalIcon name="arrow" />
      </button>
      <span className="sr-only" role="status">
        {pending ? "Signing in. Please wait." : ""}
      </span>
    </>
  );
}
