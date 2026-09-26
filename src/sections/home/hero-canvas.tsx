"use client";

import { useEffect, useRef } from "react";

/**
 * SAVO system visual - the brand motif drawn live: square nodes
 * (WEB, MOBILE, AI, SOFTWARE, DESIGN, GROWTH) orbiting a SAVO core,
 * joined by hairlines. Subtle pointer parallax; pauses off-screen;
 * renders a single static frame under prefers-reduced-motion.
 */

const NODES = ["WEB", "MOBILE", "AI", "SOFTWARE", "DESIGN", "GROWTH"] as const;

type Sat = {
  label: string;
  angle: number;
  radius: number; // fraction of min(w,h)
  speed: number; // rad/s
  size: number;
  wobble: number;
  phase: number;
};

export function HeroCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const compact = window.matchMedia("(max-width: 640px)").matches;

    const sats: Sat[] = NODES.map((label, i) => ({
      label,
      angle: (i / NODES.length) * Math.PI * 2 - Math.PI / 2,
      radius: 0.34 + (i % 2) * 0.05,
      speed: (0.05 + (i % 3) * 0.014) * (i % 2 === 0 ? 1 : -1),
      size: 7,
      wobble: 3 + (i % 3),
      phase: i * 1.7,
    }));

    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    const style = getComputedStyle(document.documentElement);
    const ink = style.getPropertyValue("--foreground").trim() || "#17171a";
    const accent = style.getPropertyValue("--accent").trim() || "#d9480f";
    // Canvas cannot parse var() inside ctx.font - resolve the mono stack first.
    const monoStack = style.getPropertyValue("--font-fragment").trim() || "ui-monospace, monospace";

    function resize() {
      if (!canvas) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(time: number, dt: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.5;
      const R = Math.min(w, h);
      const t = time / 1000;

      pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
      pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
      const px = pointer.x * R * 0.035;
      const py = pointer.y * R * 0.035;

      const pts = sats.map((s) => {
        if (!reduced) {
          s.angle += s.speed * dt;
        }
        const rr = s.radius * R + Math.sin(t * 0.7 + s.phase) * s.wobble;
        return {
          x: cx + Math.cos(s.angle) * rr + px * (0.5 + (s.radius % 0.1)),
          y: cy + Math.sin(s.angle) * rr * 0.92 + py,
        };
      });

      // Orbit ring
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.07;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx + px * 0.4, cy + py * 0.4, 0.39 * R, 0.36 * R, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Links: core → satellites
      ctx.globalAlpha = 0.16;
      ctx.beginPath();
      for (const p of pts) {
        ctx.moveTo(cx + px, cy + py);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();

      // Links: satellite ring
      ctx.globalAlpha = 0.1;
      ctx.beginPath();
      pts.forEach((p, i) => {
        const q = pts[(i + 1) % pts.length];
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
      });
      ctx.stroke();

      // Satellites - square nodes
      ctx.globalAlpha = 1;
      ctx.fillStyle = ink;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const s = compact ? 5 : 7;
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
        ctx.globalAlpha = 0.62;
        ctx.font = `600 9px ${monoStack}`;
        ctx.fillStyle = ink;
        const label = sats[i].label;
        const tw = ctx.measureText(label).width;
        const below = p.y < cy;
        ctx.fillText(
          label,
          p.x - tw / 2,
          below ? p.y + 20 : p.y - 12,
        );
        ctx.globalAlpha = 1;
      }

      // Core - accent square with pulse frame
      const coreS = compact ? 13 : 16;
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.5;
      const pulse = reduced ? 0 : Math.sin(t * 1.4) * 3;
      ctx.strokeRect(
        cx + px - coreS / 2 - 5 - pulse,
        cy + py - coreS / 2 - 5 - pulse,
        coreS + 10 + pulse * 2,
        coreS + 10 + pulse * 2,
      );
      ctx.globalAlpha = 1;
      ctx.fillStyle = accent;
      ctx.fillRect(cx + px - coreS / 2, cy + py - coreS / 2, coreS, coreS);
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = ink;
      ctx.font = `700 10px ${monoStack}`;
      const coreLabel = "SAVO";
      const cw = ctx.measureText(coreLabel).width;
      ctx.fillText(coreLabel, cx + px - cw / 2, cy + py + coreS / 2 + 18);
      ctx.globalAlpha = 1;
    }

    function frame(time: number) {
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      if (visible) draw(time, dt);
      if (!reduced) raf = requestAnimationFrame(frame);
    }

    function onPointer(e: PointerEvent) {
      const el = canvasRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      pointer.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }

    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now(), 0);
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();

    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
    });
    io.observe(canvas);

    if (reduced) {
      draw(performance.now(), 0);
    } else {
      raf = requestAnimationFrame(frame);
      window.addEventListener("pointermove", onPointer, { passive: true });
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      role="presentation"
    />
  );
}
