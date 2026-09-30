"use client";

/**
 * Client-side notification helpers for the Live Chat inbox: an
 * attention-grade Web Audio chime (no audio files, works everywhere,
 * unlocked on the admin's first click), browser notifications via the
 * Notification API, and admin-controlled preferences in localStorage
 * (spec §24, never spam, always controllable).
 */

const SOUND_KEY = "savo_livechat_sound";
const NOTIFY_KEY = "savo_livechat_notify";
const BANNER_KEY = "savo_livechat_banner_dismissed";
const DEDUPE_PREFIX = "savo_lc_dedupe_";

export function soundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SOUND_KEY) !== "off";
}
export function setSoundEnabled(on: boolean): void {
  localStorage.setItem(SOUND_KEY, on ? "on" : "off");
}
export function notificationsWanted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(NOTIFY_KEY) !== "off";
}
export function setNotificationsWanted(on: boolean): void {
  localStorage.setItem(NOTIFY_KEY, on ? "on" : "off");
}
export function bannerDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(BANNER_KEY) === "1";
}
export function dismissBanner(): void {
  localStorage.setItem(BANNER_KEY, "1");
}

/* ─────────────────────── Web Audio chime engine ─────────────────────── */
/*
 * Loud-by-design chime. Lessons baked in:
 *  • The AudioContext stays SUSPENDED until a user gesture happens in the
 * page, so we re-arm resume on EVERY pointerdown/keydown (cheap), and
 *    a chime only plays once the context is actually running (never a
 *    frozen-clock burst of notes).
 *  • Loudness: each note stacks a sine fundamental + triangle octave +
 *    fifth harmonic through a hot envelope, into a master compressor so
 *    we can push gain without clipping.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let unlockArmed = false;

function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 6;
    const g = ctx.createGain();
    g.gain.value = 1;
    g.connect(comp);
    comp.connect(ctx.destination);
    master = g;
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
  return ctx;
}

/** Re-arm on every interaction: the context may be created long before the
 *  admin's first click (or re-suspended by the browser), so one-shot
 *  unlocking is not enough. No-op once running. */
export function unlockAudio(): void {
  if (typeof window === "undefined" || unlockArmed) return;
  unlockArmed = true;
  const resume = () => {
    audioCtx(); // creates if needed and resumes if suspended
  };
  window.addEventListener("pointerdown", resume, { capture: true });
  window.addEventListener("keydown", resume, { capture: true });
  window.addEventListener("visibilitychange", () => {
    if (!document.hidden) resume();
  }, { capture: true });
}

function tone(freq: number, at: number, dur: number, vol: number): void {
  const ac = audioCtx();
  if (!ac || !master || ac.state !== "running") return;
  const t0 = ac.currentTime + at;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  g.connect(master);

  const fundamental = ac.createOscillator();
  fundamental.type = "sine";
  fundamental.frequency.value = freq;
  const octave = ac.createOscillator();
  octave.type = "triangle";
  octave.frequency.value = freq * 2;
  const octaveGain = ac.createGain();
  octaveGain.gain.value = 0.45;
  const fifth = ac.createOscillator();
  fifth.type = "sine";
  fifth.frequency.value = freq * 3;
  const fifthGain = ac.createGain();
  fifthGain.gain.value = 0.18;

  fundamental.connect(g);
  octave.connect(octaveGain);
  octaveGain.connect(g);
  fifth.connect(fifthGain);
  fifthGain.connect(g);

  for (const osc of [fundamental, octave, fifth]) {
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }
}

/** Whether the chime can actually be heard right now (context running). */
export function chimeReady(): boolean {
  const c = audioCtx();
  return !!c && c.state === "running";
}

/** New human request / enquiry: loud rising three-note chime. */
export function playRequestChime(): void {
  if (!soundEnabled()) return;
  tone(659.25, 0, 0.55, 0.5); // E5
  tone(880, 0.16, 0.55, 0.5); // A5
  tone(1174.66, 0.32, 0.85, 0.45); // D6, ring-out
}

/** New inbound email: two descending notes, distinct character. */
export function playEmailChime(): void {
  if (!soundEnabled()) return;
  tone(1046.5, 0, 0.5, 0.45); // C6
  tone(783.99, 0.2, 0.7, 0.45); // G5
}

/** New visitor message: single firm ding. */
export function playMessageDing(): void {
  if (!soundEnabled()) return;
  tone(880, 0, 0.45, 0.35);
}

/* ─────────────────────── Browser notifications ─────────────────────── */

export type PermState = "default" | "granted" | "denied" | "unsupported";

export function permissionState(): PermState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as PermState;
}

/** Must be called from a user gesture (button click). */
export async function requestNotificationPermission(): Promise<PermState> {
  if (permissionState() === "unsupported") return "unsupported";
  try {
    const result = (await Notification.requestPermission()) as PermState;
    return result;
  } catch {
    return "denied";
  }
}

/** Cross-tab dedupe: only the first admin tab sounds per event. */
function firstTabToClaim(key: string, windowMs = 4000): boolean {
  try {
    const now = Date.now();
    const prev = Number(localStorage.getItem(DEDUPE_PREFIX + key) ?? 0);
    if (prev && now - prev < windowMs) return false;
    localStorage.setItem(DEDUPE_PREFIX + key, String(now));
    return true;
  } catch {
    return true;
  }
}

export function showBrowserNotification(opts: {
  title: string;
  body: string;
  tag: string;
  href?: string;
  requireHidden?: boolean; // only when the tab is in the background
}): void {
  if (!notificationsWanted()) return;
  if (permissionState() !== "granted") return;
  if (opts.requireHidden && !document.hidden) return;
  if (!firstTabToClaim(opts.tag)) return;
  try {
    const n = new Notification(opts.title, {
      body: opts.body,
      tag: opts.tag,
      icon: "/savo-mark.svg",
      badge: "/savo-mark.svg",
    });
    n.onclick = () => {
      window.focus();
      n.close();
      if (opts.href) window.location.href = opts.href;
    };
  } catch {
    // Some platforms require a service worker; degrade silently to sound.
  }
}
