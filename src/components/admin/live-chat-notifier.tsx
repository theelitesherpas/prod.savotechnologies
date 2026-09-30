"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  bannerDismissed,
  dismissBanner,
  permissionState,
  playMessageDing,
  playRequestChime,
  requestNotificationPermission,
  showBrowserNotification,
  unlockAudio,
  type PermState,
} from "@/lib/livechat/notify-client";
import { cn } from "@/lib/utils";

/**
 * LiveChatNotifier — the admin's never-miss-a-chat layer, mounted once in
 * the protected admin layout so it lives across every admin page:
 *
 *   • SSE subscription to the live-chat bus (one long-lived connection)
 *   • Attention chime (Web Audio) on new human requests, soft ding on
 *     visitor messages in threads not currently open
 *   • Browser notifications that surface in other tabs / other windows,
 *     clickable straight into the conversation
 *   • Permission banner on first login (spec §24/§43: consent-first)
 *   • Live nav badge: debounced router.refresh() keeps the sidebar's
 *     waiting-count current without polling
 *   • Attention title flash while a request waits and the tab is hidden
 */

const ORIGINAL_TITLE = typeof document !== "undefined" ? document.title : "";

export function LiveChatNotifier() {
  const router = useRouter();
  const [perm, setPerm] = useState<PermState>("unsupported");
  const [showBanner, setShowBanner] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashing = useRef(false);

  useEffect(() => {
    unlockAudio();
    // Read browser-only APIs (Notification.permission, localStorage) on
    // mount — they cannot be read during SSR render.
     
    const state = permissionState();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPerm(state);
     
    setShowBanner(state === "default" && !bannerDismissed());
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => router.refresh(), 1200);
  }, [router]);

  /* Title flash: alternate the tab title while requests wait and the tab
     is hidden — the classic "something needs you" signal. */
  const setTitleFlash = useCallback((on: boolean) => {
    if (on === flashing.current) return;
    flashing.current = on;
    if (on) {
      let toggle = false;
      flashTimer.current = setInterval(() => {
        if (!document.hidden) {
          document.title = ORIGINAL_TITLE;
          return;
        }
        toggle = !toggle;
        document.title = toggle ? "🔔 New live chat request — Savo Admin" : ORIGINAL_TITLE;
      }, 1200);
    } else {
      if (flashTimer.current) clearInterval(flashTimer.current);
      document.title = ORIGINAL_TITLE;
    }
  }, []);

  useEffect(() => {
    const onFocus = () => setTitleFlash(false);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [setTitleFlash]);

  /* ── The stream ── */
  useEffect(() => {
    const es = new EventSource("/api/admin/live-chat/stream");

    const fetchConversation = async (id: string) => {
      try {
        const res = await fetch(`/api/admin/live-chat/conversations/${id}`, { cache: "no-store" });
        const json = (await res.json()) as { ok: boolean; conversation?: { leadName: string | null; service: string | null } };
        return json.ok ? json.conversation : null;
      } catch {
        return null;
      }
    };

    const onNewConversation = (raw: MessageEvent) => {
      try {
        const evt = JSON.parse(raw.data) as { conversationId: string };
        playRequestChime();
        setTitleFlash(true);
        scheduleRefresh();
        void (async () => {
          const conv = await fetchConversation(evt.conversationId);
          const name = conv?.leadName ?? "A visitor";
          showBrowserNotification({
            title: "New live chat request",
            body: `${name}${conv?.service ? ` · ${conv.service}` : ""} wants to talk to the Savo team.`,
            tag: `request-${evt.conversationId}`,
            href: `/admin/live-chat`,
          });
        })();
      } catch {
        /* ignore */
      }
    };

    const onMessage = (raw: MessageEvent) => {
      try {
        const evt = JSON.parse(raw.data) as { conversationId: string; message: { type: string; body: string } };
        if (evt.message?.type !== "visitor") return;
        // Only chime if this thread isn't the one the admin is watching.
        const watching =
          location.pathname.startsWith("/admin/live-chat") &&
          document.querySelector("section header p")?.textContent?.length; // detail open heuristic
        if (!watching) playMessageDing();
        if (document.hidden) {
          showBrowserNotification({
            title: "New chat message",
            body: evt.message.body.slice(0, 90),
            tag: `msg-${evt.conversationId}-${evt.message.body.length}`,
            href: "/admin/live-chat",
            requireHidden: true,
          });
        }
        scheduleRefresh();
      } catch {
        /* ignore */
      }
    };

    const onCounts = () => scheduleRefresh();

    es.addEventListener("conversation.new", onNewConversation as EventListener);
    es.addEventListener("message.new", onMessage as EventListener);
    es.addEventListener("counts.changed", onCounts as EventListener);
    return () => {
      es.close();
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      setTitleFlash(false);
    };
  }, [scheduleRefresh, setTitleFlash]);

  const enable = async () => {
    const result = await requestNotificationPermission();
    setPerm(result);
    setShowBanner(false);
    if (result === "granted") {
      showBrowserNotification({
        title: "Notifications enabled",
        body: "You will be alerted the moment a visitor requests to talk.",
        tag: "notify-enabled",
      });
    }
  };

  return (
    <>
      {showBanner ? (
        <div className="fixed bottom-5 right-5 z-[70] w-[min(24rem,calc(100vw-2.5rem))] rounded-[8px] border border-accent/40 bg-white p-4 shadow-[0_18px_50px_rgb(10_10_14/0.22)]">
          <p className="t-sm font-semibold text-foreground/90">Never miss a chat request</p>
          <p className="t-caption mt-1 text-muted">
            Enable browser notifications so new Talk-to-Human requests reach you even when this tab is in the background.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => void enable()}
              className="t-caption rounded-[4px] border border-accent/50 bg-accent/[0.06] px-3 py-1.5 font-semibold text-accent transition-colors hover:border-accent"
            >
              Enable notifications
            </button>
            <button
              onClick={() => {
                dismissBanner();
                setShowBanner(false);
              }}
              className="t-caption rounded-[4px] border border-border px-3 py-1.5 text-muted transition-colors hover:text-foreground"
            >
              Not now
            </button>
          </div>
        </div>
      ) : null}
      <span className={cn("hidden")} aria-hidden="true" data-perm={perm} />
    </>
  );
}
