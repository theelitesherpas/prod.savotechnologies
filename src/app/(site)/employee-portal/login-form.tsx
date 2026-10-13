"use client";

import { useState } from "react";
import { FormGuard } from "@/components/admin/form-guard";
import { useCaptcha, captchaBlocked } from "@/components/shared/captcha";
import { PortalLoginFields } from "@/components/portal/login-fields";
import { PortalIcon } from "@/components/portal/workspace-ui";
import styles from "@/components/portal/portal.module.css";
import { employeeLoginAction } from "./actions";

export function EmployeeLoginForm({ error }: { error?: string }) {
  const captcha = useCaptcha("employee");
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  return (
    <section className={styles.loginCard} aria-labelledby="employee-signin">
      <h1 id="employee-signin">Employee sign in.</h1>
      <p>
        Welcome back to your Savo workspace. Sign in with your registered work
        email.
      </p>
      {error ? (
        <div role="alert" className={styles.loginError}>
          {error}
        </div>
      ) : null}
      <FormGuard
        action={employeeLoginAction}
        summaryHeading="Check your sign-in details"
        className={styles.loginForm}
        validate={() => {
          setCaptchaError(null);
          if (captchaBlocked(captcha)) {
            const message =
              "Please complete the human verification before signing in.";
            setCaptchaError(message);
            return [{ anchor: "emp-captcha", message }];
          }
          return [];
        }}
      >
        <PortalLoginFields
          kind="employee"
          captcha={captcha}
          captchaError={captchaError}
        />
      </FormGuard>
      <div className={styles.loginHelp}>
        <h3>Need a hand getting in?</h3>
        <p>
          Contact HR if you need account access or help with your sign-in
          details.
        </p>
        <a href="mailto:hr@savotechnologies.com">
          Contact HR <PortalIcon name="arrow" />
        </a>
      </div>
    </section>
  );
}
