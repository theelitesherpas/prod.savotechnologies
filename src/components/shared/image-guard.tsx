"use client";

import { useEffect } from "react";

/**
 * SiteImageGuard — frontend photo deterrence for marked sections.
 *
 * Any element carrying `data-image-guard` (or an <img> itself) opts its
 * photography into three honest deterrents:
 *   - no right-click "Save image…" menu (contextmenu prevented)
 *   - no drag-to-desktop / drag-into-editor (dragstart prevented)
 *   - no mobile long-press save/share sheet (-webkit-touch-callout, user-
 *     select — see the [data-image-guard] rules in globals.css)
 *
 * Honest scope: a browser that can display a photo can ultimately capture
 * it (devtools, screenshots). This guard stops the casual right-click
 * copy, not a determined actor — real protection stays with copyright,
 * licensing terms and watermarking. Guarded areas log a short notice in
 * the console on the first blocked attempt.
 */
export function SiteImageGuard() {
  useEffect(() => {
    let warned = false;
    const notice = () => {
      if (warned) return;
      warned = true;
      console.info(
        "%cSavo Technologies%c — photography and project imagery on this page are company assets and may not be copied. Licensing and press enquiries are welcome.",
        "font-weight:700",
        "font-weight:400",
      );
    };

    const guarded = (target: EventTarget | null): boolean => {
      const el = target instanceof Element ? target : null;
      return !!el && !!el.closest("[data-image-guard] img, img[data-image-guard]");
    };

    const onContextMenu = (event: MouseEvent) => {
      if (guarded(event.target)) {
        event.preventDefault();
        notice();
      }
    };
    const onDragStart = (event: DragEvent) => {
      if (guarded(event.target)) {
        event.preventDefault();
        notice();
      }
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, []);

  return null;
}
