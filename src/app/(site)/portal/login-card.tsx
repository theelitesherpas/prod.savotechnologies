"use client";

import { clientLoginAction } from "@/app/portal/actions";
import { FormGuard } from "@/components/admin/form-guard";
import { useCaptcha, captchaBlocked } from "@/components/shared/captcha";
import { PortalIcon } from "@/components/portal/workspace-ui";
import { PortalLoginFields } from "@/components/portal/login-fields";
import styles from "@/components/portal/portal.module.css";
import { useState } from "react";

export function PortalLoginCard({ error }: { error?: string }) {
  const captcha = useCaptcha("client");
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const message =
    error === "invalid"
      ? "Enter a valid email address and your password, then try again."
      : error;
  return (
    <section className={styles.loginCard} aria-labelledby="portal-signin">
      <h1 id="portal-signin">Client sign in.</h1>
      <p>Welcome back. Use the account details provided by your Savo team.</p>
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
            const message =
              "Please complete the human verification before signing in.";
            setCaptchaError(message);
            return [{ anchor: "pt-captcha", message }];
          }
          return [];
        }}
      >
        <PortalLoginFields
          kind="client"
          captcha={captcha}
          captchaError={captchaError}
        />
      </FormGuard>
      <div className={styles.loginHelp}>
        <h3>Need help with your account?</h3>
        <p>For access or sign-in help, get in touch with your Savo team.</p>
        <a href="mailto:hello@savotechnologies.com">
          Contact the team <PortalIcon name="arrow" />
        </a>
      </div>
    </section>
  );
}
