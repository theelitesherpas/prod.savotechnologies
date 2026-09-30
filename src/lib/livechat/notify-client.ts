"use client";

/**
 * Client-side notification helpers for the Live Chat inbox: an
 * attention-grade Web Audio chime (no audio files, works everywhere,
 * unlocked on the admin's first click), browser notifications via the
 * Notification API, and admin-controlled preferences in localStorage
 * (spec §24 — never spam, always controllable).
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

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
  return ctx;
}

/** Unlock audio on the admin's first interaction (browser autoplay policy). */
export function unlockAudio(): void {
  if (typeof window === "undefined") return;
  const unlock = () => {
    audioCtx();
    window.removeEventListener("pointerdown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true });
}

function tone(freq: number, at: number, dur: number, vol: number, type: OscillatorType = "sine"): void {
  const ac = audioCtx();
  if (!ac) return;
  const t0 = ac.currentTime + at;
  const osc = ac.createOscillator();
  const osc2 = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc2.type = "triangle";
  osc.frequency.value = freq;
  osc2.frequency.value = freq * 2; // bell-like overtone
  const peak = vol;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc2.start(t0);
  osc.stop(t0 + dur + 0.05);
  osc2.stop(t0 + dur + 0.05);
}

/** New human request: rising three-note chime — built to grab attention. */
export function playRequestChime(): void {
  if (!soundEnabled()) return;
  tone(659.25, 0, 0.5, 0.22); // E5
  tone(880, 0.16, 0.5, 0.22); // A5
  tone(1174.66, 0.32, 0.7, 0.2); // D6
}

/** New visitor message: single soft ding. */
export function playMessageDing(): void {
  if (!soundEnabled()) return;
  tone(880, 0, 0.35, 0.14);
}

/** New inbound email: two descending notes, distinct from chat events. */
export function playEmailChime(): void {
  if (!soundEnabled()) return;
  tone(1046.5, 0, 0.4, 0.18); // C6
  tone(783.99, 0.18, 0.55, 0.18); // G5
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
