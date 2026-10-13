"use client";

import { clientLoginAction } from "@/app/portal/actions";
import { FormGuard } from "@/components/admin/form-guard";
import {
  CaptchaGate,
  useCaptcha,
  captchaBlocked,
  type CaptchaState,
} from "@/components/shared/captcha";
import { PortalIcon } from "@/components/portal/workspace-ui";
import styles from "@/components/portal/portal.module.css";
import { useState } from "react";
import { useFormStatus } from "react-dom";

function SignInFields({
  captcha,
  captchaError,
}: {
  captcha: CaptchaState;
  captchaError: string | null;
}) {
  const { pending } = useFormStatus();
  const [visible, setVisible] = useState(false);
  return (
    <>
      <div className={styles.loginField}>
        <label htmlFor="pt-email">Email address</label>
        <input
          id="pt-email"
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
        <label htmlFor="pt-password">Password</label>
        <div className={styles.passwordWrap}>
          <input
            id="pt-password"
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
            aria-controls="pt-password"
            onClick={() => setVisible(!visible)}
            disabled={pending}
          >
            <PortalIcon name={visible ? "eye-off" : "eye"} />
          </button>
        </div>
      </div>
      <CaptchaGate captcha={captcha} error={captchaError} />
      {captcha.token ? (
        <input type="hidden" name="captchaToken" value={captcha.token} />
      ) : null}
      <button className={styles.primary} type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in to your workspace"}
        <PortalIcon name="arrow" />
      </button>
      <span className="sr-only" role="status">
        {pending ? "Signing in. Please wait." : ""}
      </span>
    </>
  );
}
export function PortalLoginCard({ error }: { error?: string }) {
  const captcha = useCaptcha("client");
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const message =
    error === "invalid"
      ? "Enter a valid email address and your password, then try again."
      : error;
  return (
    <section className={styles.loginCard} aria-labelledby="portal-signin">
      <h2 id="portal-signin">Welcome back.</h2>
      <p>
        Sign in with the email address and password provided by your Savo team.
      </p>
      {message ? (
        <div role="alert" className={styles.loginError}>
          {message}
        </div>
      ) : null}
      <FormGuard
        action={clientLoginAction}
        summaryHeading="Check your sign-in details"
        className={styles.loginForm}
        validate={() => {
          setCaptchaError(null);
          if (captchaBlocked(captcha)) {
            setCaptchaError(
              "Please complete the human verification before signing in.",
            );
            return [
              {
                anchor: "pt-email",
                message:
                  "Please complete the human verification before signing in.",
              },
            ];
          }
          return [];
        }}
      >
        <SignInFields captcha={captcha} captchaError={captchaError} />
      </FormGuard>
      <div className={styles.loginHelp}>
        <h3>Need access or help signing in?</h3>
        <p>
          Your account is provided by the Savo team. If you haven’t received
          your credentials or can’t sign in, contact us for help.
        </p>
        <a href="mailto:hello@savotechnologies.com">
          hello@savotechnologies.com
          <PortalIcon name="arrow" />
        </a>
      </div>
    </section>
  );
}
