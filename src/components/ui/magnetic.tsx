"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";

/**
 * Magnetic hover wrapper - the child leans toward the cursor with a
 * spring-like return. Subtle by default (strength 0.15-0.3 works well
 * for buttons). Disabled on touch and reduced-motion.
 */
export function Magnetic({
  children,
  strength = 0.2,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const rafId = useRef<number>(0);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  const animate = () => {
    const dx = target.current.x - current.current.x;
    const dy = target.current.y - current.current.y;
    current.current.x += dx * 0.12;
    current.current.y += dy * 0.12;
    if (ref.current) {
      ref.current.style.transform = `translate(${current.current.x}px, ${current.current.y}px)`;
    }
    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
      rafId.current = requestAnimationFrame(animate);
    }
  };

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    target.current = { x: relX * strength, y: relY * strength };
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(animate);
  };

  const onLeave = () => {
    target.current = { x: 0, y: 0 };
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(animate);
  };

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ display: "inline-flex", willChange: "transform" }}
    >
      {children}
    </div>
  );
}
