"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CaptchaGate, captchaBlocked, useCaptcha } from "@/components/shared/captcha";
import { INITIAL_PORTAL_LOGIN, type PortalKind, type PortalLoginState } from "@/lib/portal-login-state";
import { PortalIcon } from "./workspace-ui";
import styles from "./login.module.css";

type Props = {
  kind: PortalKind;
  action: (previous: PortalLoginState, form: FormData) => Promise<PortalLoginState>;
  error?: string;
};

/** Shared task and states; independent server-side identity/session namespaces. */
export function PortalLoginForm(props: Props) {
  const [revision, setRevision] = useState(0);
  return <LoginForm key={revision} {...props} restart={() => setRevision((n) => n + 1)} />;
}

function LoginForm({ kind, action, error, restart }: Props & { restart: () => void }) {
  const [method, setMethod] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [visible, setVisible] = useState(false);
  const [code, setCode] = useState("");
  const [state, formAction, pending] = useActionState(async (previous: PortalLoginState, form: FormData) => {
    const result = await action(previous, form);
    if (result.stage === "code" && !result.error) {
      setPassword("");
      setCode("");
    }
    return result;
  }, error ? { ...INITIAL_PORTAL_LOGIN, error } : INITIAL_PORTAL_LOGIN);
  const [clientError, setClientError] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const captcha = useCaptcha(kind);
  const alertRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const codeStep = state.stage === "code";
  const prefix = kind === "employee" ? "emp" : "pt";
  const message = clientError || state.error;
  const support = kind === "employee" ? "hr@savotechnologies.com" : "hello@savotechnologies.com";

  useEffect(() => {
    if (state.error) {
      alertRef.current?.focus();
      if (state.stage === "credentials") captcha.reset();
    } else if (state.stage === "code") {
      codeRef.current?.focus();
    }
    // The response, not each captcha render, owns reset/focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  useEffect(() => {
    if (!codeStep) return;
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [codeStep]);
  const wait = Math.max(0, Math.ceil(((state.resendAt || 0) - now) / 1000));
  const expired = now > 0 && now >= (state.expiresAt || Infinity);
  const switchMethod = (next: "password" | "otp") => {
    setMethod(next);
    setClientError(null);
    emailRef.current?.focus();
  };

  return (
    <section className={styles.card} aria-labelledby={`${prefix}-signin`}>
      <div className={styles.heading}>
        {codeStep ? <span className={styles.mailIcon}><PortalIcon name="message" /></span> : null}
        <h1 id={`${prefix}-signin`}>{codeStep ? "Check your email." : method === "otp" ? "Sign in with a code." : "Welcome back."}</h1>
        <p>{codeStep ? <>We sent a 6-digit sign-in code to <strong>{state.email}</strong></> : method === "otp" ? "No password needed. We’ll send a one-time code to your registered email." : `Sign in to your ${kind === "employee" ? "employee workspace" : "client workspace"}.`}</p>
      </div>
      {message ? <div ref={alertRef} tabIndex={-1} role="alert" className={styles.error}>{message}</div> : null}
      <form action={formAction} className={styles.form} aria-busy={pending} onSubmit={(event) => {
        setClientError(null);
        if (!codeStep && captchaBlocked(captcha)) {
          event.preventDefault();
          setClientError("Please complete the human verification before continuing.");
          document.getElementById(`${prefix}-captcha`)?.focus();
        }
      }}>
        {codeStep ? <>
          <input type="hidden" name="email" value={state.email || ""} />
          <input type="hidden" name="challengeId" value={state.challengeId || ""} />
          <div className={styles.field}>
            <label htmlFor={`${prefix}-code`}>Enter 6-digit code</label>
            <input ref={codeRef} className={styles.code} id={`${prefix}-code`} name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} required readOnly={pending} aria-describedby={`${prefix}-code-hint`} aria-invalid={Boolean(state.error)} />
            <p id={`${prefix}-code-hint`} className={styles.hint}>{expired ? "This code has expired. Request a new code to continue." : "Valid for 10 minutes. Use only your latest code."}</p>
          </div>
          <button className={styles.primary} type="submit" name="intent" value="verify-code" disabled={pending || expired}>{pending ? "Please wait…" : "Verify & sign in"}<PortalIcon name="arrow" /></button>
          <div className={styles.resend}>
            <span>Didn’t receive an email? Check spam, or</span>
            <button type="submit" name="intent" value="resend-code" formNoValidate disabled={pending || wait > 0}>{wait > 0 ? `Resend code in ${wait}s` : "Resend code"}</button>
          </div>
          <button className={styles.secondary} type="button" disabled={pending} onClick={restart}><PortalIcon name="back" />Back to sign in</button>
        </> : <>
          <div className={styles.field}>
            <label htmlFor={`${prefix}-email`}>{kind === "employee" ? "Work email" : "Email address"}</label>
            <input ref={emailRef} id={`${prefix}-email`} name="email" type="email" inputMode="email" autoComplete="username" placeholder="you@company.com" required maxLength={120} spellCheck={false} autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} readOnly={pending} />
          </div>
          {method === "password" ? <div className={styles.field}>
            <label htmlFor={`${prefix}-password`}>Password</label>
            <div className={styles.passwordWrap}>
              <input id={`${prefix}-password`} name="password" type={visible ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" required maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} readOnly={pending} />
              <button className={styles.passwordToggle} type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} aria-controls={`${prefix}-password`} disabled={pending} onClick={() => setVisible(!visible)}><PortalIcon name={visible ? "eye-off" : "eye"} /></button>
            </div>
          </div> : null}
          <div className={styles.options}>
            <label className={styles.remember}><input name="remember" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} disabled={pending} /><span>Remember me<span className="sr-only"> for 30 days on this device</span></span></label>
            {method === "password" ? <button type="button" disabled={pending} onClick={() => switchMethod("otp")}>Forgot password?</button> : null}
          </div>
          <div className={styles.captcha}><CaptchaGate id={`${prefix}-captcha`} captcha={captcha} error={clientError} /></div>
          <input type="hidden" name="captchaToken" value={captcha.token || ""} />
          <div className={styles.actions}>
            <button className={styles.primary} type="submit" name="intent" value={method === "password" ? "password" : "send-code"} disabled={pending || captcha.unavailable}>{pending ? "Please wait…" : method === "password" ? "Sign in" : "Send sign-in code"}</button>
            <button className={styles.secondary} type="button" aria-label={method === "password" ? "Sign in with email OTP" : "Use password instead"} disabled={pending} onClick={() => switchMethod(method === "password" ? "otp" : "password")}>{method === "password" ? "Use email OTP" : "Use password"}</button>
          </div>
        </>}
        <span className="sr-only" role="status">{pending ? "Processing your sign-in. Please wait." : codeStep && !state.error ? "Sign-in code sent. Check your registered email." : ""}</span>
      </form>
      <p className={styles.help}><span>Registered accounts only.</span><a href={`mailto:${support}`}>{kind === "employee" ? "Contact HR" : "Contact Savo support"}<PortalIcon name="arrow" /></a></p>
    </section>
  );
}
