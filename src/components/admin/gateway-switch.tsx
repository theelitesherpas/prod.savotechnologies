"use client";
import { useFormStatus } from "react-dom";
import { setGatewayAvailabilityAction } from "@/app/admin/(protected)/settings/payments/availability-actions";
import type { PaymentProvider } from "@/lib/payment-availability";
function SwitchButton({ title, enabled }: { title: string; enabled: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" role="switch" aria-label={`${title} availability`} aria-checked={enabled} disabled={pending} className="inline-flex min-h-11 min-w-24 shrink-0 items-center justify-center gap-2 rounded-full border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-wait disabled:opacity-60">
    <span aria-hidden="true" className={`inline-flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors ${enabled ? "bg-[var(--accent)]" : "bg-muted/40"}`}><span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-4" : "translate-x-0"}`}/></span>
    <span>{pending ? "Saving…" : enabled ? "On" : "Off"}</span>
  </button>;
}
export function GatewaySwitch({ provider, state }: { provider: PaymentProvider; state: { enabled: boolean; revision: number } }) {
  const title = provider === "razorpay" ? "Razorpay" : "PayPal";
  return <form action={setGatewayAvailabilityAction} className="adm-card mb-5 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
    <input type="hidden" name="provider" value={provider}/><input type="hidden" name="enabled" value={String(!state.enabled)}/><input type="hidden" name="revision" value={state.revision}/>
    <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Available at checkout</p><p className="t-caption mt-1 text-muted">{state.enabled ? "On — shown when credentials, currency and environment are ready." : "Off — hidden from the method chooser; new gateway checkout is blocked. Credentials are retained."}</p></div>
    <SwitchButton title={title} enabled={state.enabled}/>
  </form>;
}
