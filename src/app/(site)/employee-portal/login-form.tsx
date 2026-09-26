"use client";

import { FormGuard } from "@/components/admin/form-guard";
import { CaptchaGate, useCaptcha, captchaBlocked } from "@/components/shared/captcha";
import { useState } from "react";
import { employeeLoginAction } from "./actions";

export function EmployeeLoginForm() {
  const captcha = useCaptcha("employee");
  const [captchaErr, setCaptchaErr] = useState<string | null>(null);
  return (
    <FormGuard action={employeeLoginAction} className="space-y-5" validate={() => {
        setCaptchaErr(null);
        if (captchaBlocked(captcha)) {
          setCaptchaErr("Please complete the verification.");
          return [{ anchor: "emp-email", message: "Please complete the verification." }];
        }
        return [];
      }}>
      <div>
        <label htmlFor="emp-email" className="mb-1.5 block text-[0.8125rem] font-semibold text-muted">
          Email
        </label>
        <input
          id="emp-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={120}
          className="field"
          placeholder="you@savotechnologies.com"
        />
      </div>
      <div>
        <label htmlFor="emp-password" className="mb-1.5 block text-[0.8125rem] font-semibold text-muted">
          Password
        </label>
        <input
          id="emp-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          className="field"
        />
      </div>
      <CaptchaGate captcha={captcha} error={captchaErr} />
      <button
        type="submit"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[2px] bg-foreground text-[0.875rem] font-semibold tracking-wide text-background transition-all duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent"
      >
        Sign in
        <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
        </svg>
      </button>
          {captcha.token ? <input type="hidden" name="captchaToken" value={captcha.token} /> : null}
    </FormGuard>
  );
}
