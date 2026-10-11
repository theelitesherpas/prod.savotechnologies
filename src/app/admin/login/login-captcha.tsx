"use client";

import { useState } from "react";
import { CaptchaGate, useCaptcha, captchaBlocked } from "@/components/shared/captcha";

/** Client captcha for the admin login form (server component parent). */
export function AdminLoginCaptcha() {
  const captcha = useCaptcha("admin");
  const [captchaErr] = useState<string | null>(null);

  // Expose the token to the parent form via a hidden input
  return (
    <>
      <CaptchaGate captcha={captcha} error={captchaErr} />
      {captcha.token ? <input type="hidden" name="captchaToken" value={captcha.token} /> : null}
      {!captchaBlocked(captcha) ? null : (
        <span data-captcha-required="true" hidden />
      )}
    </>
  );
}
