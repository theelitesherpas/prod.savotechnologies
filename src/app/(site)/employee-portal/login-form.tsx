"use client";

import { useState } from "react";
import { FormGuard } from "@/components/admin/form-guard";
import { CaptchaGate, useCaptcha, captchaBlocked } from "@/components/shared/captcha";
import { employeeLoginAction } from "./actions";

export function EmployeeLoginForm() {
  const captcha = useCaptcha("employee");
  const [captchaErr, setCaptchaErr] = useState<string | null>(null);

  return (
    <FormGuard
      action={employeeLoginAction}
      className="space-y-5"
      validate={() => {
        setCaptchaErr(null);
        if (captchaBlocked(captcha)) {
          setCaptchaErr("Please complete the verification.");
          return [{ anchor: "emp-email", message: "Please complete the verification." }];
        }
        return [];
      }}
    >
      <div>
        <label htmlFor="emp-email" className="mb-1.5 block text-[0.8125rem] font-semibold text-[#6a6e75]">
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
          placeholder="name@savotechnologies.com"
          className="w-full border-0 border-b border-[#14161c]/20 bg-transparent py-2.5 text-[0.9375rem] text-[#14161c] outline-none transition-colors placeholder:text-[#9a9ea4] focus:border-[#14161c]/50"
        />
      </div>
      <div>
        <label htmlFor="emp-password" className="mb-1.5 block text-[0.8125rem] font-semibold text-[#6a6e75]">
          Password
        </label>
        <input
          id="emp-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          className="w-full border-0 border-b border-[#14161c]/20 bg-transparent py-2.5 text-[0.9375rem] text-[#14161c] outline-none transition-colors focus:border-[#14161c]/50"
        />
      </div>
      <CaptchaGate captcha={captcha} error={captchaErr} />
      {captcha.token ? <input type="hidden" name="captchaToken" value={captcha.token} /> : null}
      <button
        type="submit"
        className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-[8px] bg-[#14161c] text-[0.875rem] font-semibold tracking-wide text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#d9480f] hover:shadow-[0_8px_24px_rgb(217_72_15/0.3)]"
      >
        Sign in
        <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
        </svg>
      </button>
    </FormGuard>
  );
}
