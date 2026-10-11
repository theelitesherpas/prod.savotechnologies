"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { useProjectModal } from "@/components/shared/project-lead-modal";
import styles from "./hero.module.css";
import { LogoMarquee } from "./logo-marquee";
import { advanceGalaxyStar, createHorizonCluster, horizonLightPoint, starSparkle, type AtmosphereStar, type HorizonEllipse } from "./hero-star-motion";

/** One lightweight animation loop owns the stars and the distant planet.
 * Pointer updates never enter React state. The loop sleeps offscreen and
 * in hidden tabs; reduced motion gets a single, static canvas render. */
function HeroAtmosphere() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!scene || !canvas || !context) return;
    const hero = scene.closest("section")!;
    const planet = scene.querySelector<HTMLElement>("[data-hero-planet]")!;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(min-width: 768px) and (pointer: fine)");
    let width = 0, height = 0;
    let stars: AtmosphereStar[] = [];
    let ellipse: HorizonEllipse = { centerX: 0, centerY: 0, radiusX: 1, radiusY: 1 };
    let apex = 0, safeTop = 0, previousPlanetY = 0;
    let raf = 0, lastFrame = 0;
    // Cache a tiny star-glint texture once; the horizon keeps its original CSS light.
    const makeGlow = () => {
      const sprite = document.createElement("canvas");
      sprite.width = sprite.height = 32;
      const ctx = sprite.getContext("2d")!;
      const r = sprite.width / 2;
      const glow = ctx.createRadialGradient(r, r, 0, r, r, r);
      glow.addColorStop(0, "rgba(255,255,255,0.65)");
      glow.addColorStop(0.15, "rgba(255,244,228,0.25)");
      glow.addColorStop(0.5, "rgba(255,244,228,0.06)");
      glow.addColorStop(1, "rgba(255,100,65,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, sprite.width, sprite.height);
      return sprite;
    };
    const sparkleGlow = makeGlow();
    let inView = true;
    let cursorActive = false;
    const target = { x: 0.5, y: 0.35 };
    const position = { ...target };

    function seedStars() {
      // Repeatable organic distribution avoids visual jumps on resize.
      let seed = 417;
      const random = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      const mobile = width < 768;
      const count = Math.min(mobile ? 34 : 110, Math.floor(width * height / (mobile ? 18000 : 12500)));
      const clusters = [
        { x: 0.16, y: 0.24 },
        { x: 0.82, y: 0.17 },
        { x: 0.62, y: 0.62 },
      ];
      stars = [];
      while (stars.length < count) {
        let x = random(), y = random() * 0.78;
        if (random() < 0.55) {
          const cluster = clusters[Math.floor(random() * clusters.length)];
          const angle = random() * Math.PI * 2;
          const distance = Math.sqrt(random()) * 0.23;
          x = cluster.x + Math.cos(angle) * distance;
          y = cluster.y + Math.sin(angle) * distance * 0.65;
        }
        // Reject rather than clamp: no artificial rows at the boundaries.
        if (x < 0.015 || x > 0.985 || y < 0.035 || y > 0.78) continue;
        // Quiet space behind the centered headline.
        if (x > 0.27 && x < 0.73 && y > 0.16 && y < 0.53 && random() < 0.65) continue;
        const layer = random();
        const depth = layer < 0.72 ? 0 : layer < 0.94 ? 1 : 2;
        stars.push({
          x: x * width,
          y: y * height,
          radius: [0.35, 0.65, 1.1][depth] + random() * 0.4,
          opacity: [0.16, 0.28, 0.46][depth] + random() * 0.1,
          depth,
          phase: random() * Math.PI * 2,
          period: 3000 + random() * 5000,
          twinkles: random() < (depth === 2 ? 1 : 0.28),
          sparkles: depth === 2,
        });
      }
      stars.push(...createHorizonCluster(width, apex, safeTop));
    }

    function draw(delta: number) {
      context!.clearRect(0, 0, width, height);
      const interactive = pointer.matches && !motion.matches;
      const ease = 1 - Math.exp(-delta / 180);
      position.x += (target.x - position.x) * ease;
      position.y += (target.y - position.y) * ease;
      const offsetX = interactive ? (0.5 - position.x) * 2 : 0;
      const offsetY = interactive ? (0.35 - position.y) * 1.5 : 0;
      scene!.style.setProperty("--planet-x", `${offsetX.toFixed(3)}px`);
      scene!.style.setProperty("--planet-y", `${offsetY.toFixed(3)}px`);
      scene!.style.setProperty("--cursor-x", `${(position.x * width).toFixed(1)}px`);
      scene!.style.setProperty("--cursor-y", `${(position.y * height).toFixed(1)}px`);
      previousPlanetY = offsetY;
      const horizon = { ...ellipse, centerX: ellipse.centerX + offsetX, centerY: ellipse.centerY + offsetY };
      const sun = horizonLightPoint(interactive ? position.x : 0.5, width, horizon);
      scene!.style.setProperty("--sun-x", `${(sun.x - horizon.centerX).toFixed(2)}px`);
      scene!.style.setProperty("--sun-y", `${(sun.y - horizon.centerY + horizon.radiusY).toFixed(2)}px`);
      scene!.style.setProperty("--sun-angle", `${(sun.tangent * 180 / Math.PI).toFixed(2)}deg`);
      scene!.style.setProperty("--sun-mask-shift", `${((sun.x - horizon.centerX) / (horizon.radiusX * 2) * 100).toFixed(3)}%`);

      // Canvas sits above the planet now: physically occlude stars behind its edge.
      context!.save();
      context!.beginPath();
      context!.rect(0, 0, width, height);
      context!.moveTo(horizon.centerX + horizon.radiusX, horizon.centerY);
      context!.ellipse(horizon.centerX, horizon.centerY, horizon.radiusX, horizon.radiusY, 0, 0, Math.PI * 2);
      context!.clip("evenodd");
      for (const star of stars) {
        if (star.twinkles && !motion.matches) star.phase += delta * Math.PI * 2 / star.period;
        if (star.anchorX !== undefined && star.anchorY !== undefined) {
          // Keep the denser cloud near the emitting horizon, clear of the actions.
          star.x = star.anchorX + (motion.matches ? 0 : Math.sin(star.phase * 0.18) * 6);
          star.y = star.anchorY + (motion.matches ? 0 : Math.cos(star.phase * 0.18) * 3);
        } else if (!motion.matches) advanceGalaxyStar(star, width, height, delta);
        const glint = star.sparkles ? starSparkle(star.phase, motion.matches) : 0;
        const twinkle = star.twinkles && !motion.matches ? 0.62 + 0.38 * Math.sin(star.phase) : 1;
        const distanceLayer = [4, 10, 16][star.depth];
        const x = star.x + (interactive ? (0.5 - position.x) * distanceLayer : 0);
        const y = star.y + (interactive ? (0.35 - position.y) * distanceLayer * 0.5 : 0);
        const distance = Math.hypot(x - position.x * width, y - position.y * height);
        const influence = interactive && cursorActive ? Math.max(0, 1 - distance / 160) : 0;
        context!.beginPath();
        context!.arc(x, y, star.radius * (1 + influence * 0.07), 0, Math.PI * 2);
        context!.fillStyle = `rgba(255,255,255,${(star.opacity * twinkle + influence * 0.09).toFixed(3)})`;
        context!.fill();
        if (glint > 0.025) {
          const reach = (4 + star.radius * 2) * glint;
          context!.globalAlpha = glint * 0.8;
          context!.drawImage(sparkleGlow, x - 10, y - 10, 20, 20);
          context!.globalAlpha = 1;
          context!.strokeStyle = `rgba(255,246,230,${(glint * 0.62).toFixed(3)})`;
          context!.lineWidth = 0.65;
          context!.beginPath();
          context!.moveTo(x - reach, y); context!.lineTo(x + reach, y);
          context!.moveTo(x, y - reach * 0.7); context!.lineTo(x, y + reach * 0.7);
          context!.stroke();
        }
      }
      context!.restore();
      // No drawn sun/disk: only the original soft rim masks and halo move.
    }

    function frame(now: number) {
      // Also guard an already-delivered frame when a preference/visibility changes.
      if (!inView || document.hidden || motion.matches) {
        syncAnimation();
        return;
      }
      // Bootstrap at the mobile threshold, otherwise its first frame never runs.
      const elapsed = lastFrame ? now - lastFrame : (width < 768 ? 32 : 16);
      // Mobile ambience needs only 30fps. Desktop pointer interpolation is 60fps.
      if (width >= 768 || elapsed >= 32) {
        lastFrame = now;
        draw(Math.min(elapsed, 50));
      }
      raf = requestAnimationFrame(frame);
    }

    function syncAnimation() {
      cancelAnimationFrame(raf);
      raf = 0;
      lastFrame = 0;
      if (!inView || document.hidden) return;
      if (motion.matches) {
        target.x = position.x = 0.5;
        target.y = position.y = 0.35;
        cursorActive = false;
        draw(0);
      } else raf = requestAnimationFrame(frame);
    }

    function resize() {
      width = scene!.clientWidth;
      height = scene!.clientHeight;
      const sceneBounds = scene!.getBoundingClientRect();
      const planetBounds = planet.getBoundingClientRect();
      apex = planetBounds.top - sceneBounds.top - previousPlanetY;
      ellipse = { centerX: width / 2, centerY: apex + planetBounds.height / 2, radiusX: planetBounds.width / 2, radiusY: planetBounds.height / 2 };
      const ctas = hero.querySelector<HTMLElement>("[data-hero-ctas]");
      safeTop = (ctas?.getBoundingClientRect().bottom ?? sceneBounds.top + height * 0.58) - sceneBounds.top + 24;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      context!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedStars();
      draw(0);
    }

    const onMove = (event: PointerEvent) => {
      if (!pointer.matches || motion.matches) return;
      const bounds = scene.getBoundingClientRect();
      target.x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      target.y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      cursorActive = true;
    };
    const onLeave = () => {
      target.x = 0.5;
      target.y = 0.35;
      cursorActive = false;
    };
    const onPointerChange = () => { onLeave(); };
    const intersection = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncAnimation();
    });
    const observer = new ResizeObserver(resize);
    observer.observe(scene);
    intersection.observe(hero);
    hero.addEventListener("pointermove", onMove, { passive: true });
    hero.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", syncAnimation);
    motion.addEventListener("change", syncAnimation);
    pointer.addEventListener("change", onPointerChange);
    resize();
    syncAnimation();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      intersection.disconnect();
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", syncAnimation);
      motion.removeEventListener("change", syncAnimation);
      pointer.removeEventListener("change", onPointerChange);
    };
  }, []);

  return (
    <div ref={sceneRef} aria-hidden="true" className={styles.atmosphere}>
      <div className={styles.cornerLights} />
      <div className={styles.cursorLight} />
      <div data-hero-planet className={styles.planetMotion}>
        <div className={styles.planetSurface} />
        <div data-hero-halo className={styles.centerHalo} />
        <div className={styles.bloom} />
        <div className={styles.atmosphericGlow} />
        <div className={styles.nearGlow} />
        <div data-hero-rim className={styles.rim} />
      </div>
      <canvas ref={canvasRef} data-hero-starfield className={styles.stars} />
      <div className={styles.lowerFade} />
    </div>
  );
}

export function HeroV2() {
  const { open } = useProjectModal();

  return (
    <>
      <section data-home-hero className={`${styles.hero} relative min-w-0 overflow-hidden text-white`}>
        <HeroAtmosphere />
        <div className={`${styles.content} relative z-10 mx-auto flex w-full max-w-[1120px] flex-col items-center px-6 text-center sm:px-8`}>
          <h1 className={`${styles.headline} font-serif text-[clamp(2.1rem,4.8vw,3.9rem)] font-semibold leading-[1.12] tracking-[-0.018em] text-white`}>
            <span>We turn bold ideas into</span>{" "}
            <span>digital products built to grow.</span>
          </h1>
          <p className={`${styles.description} mx-auto mt-6 max-w-[1040px] text-[1rem] leading-[1.6] text-white/55`}>
            <span>At Savo Technologies, we design and build websites, mobile apps, custom software and AI systems around your business.</span>{" "}
            <span>From launching a product to improving day-to-day operations, we help you work out what matters and build it properly.</span>
          </p>
          <div data-hero-ctas className={`${styles.actions} mt-9 flex flex-col items-center gap-4 sm:flex-row sm:gap-5`}>
            <button
              type="button"
              style={{ borderRadius: 3 }}
              onClick={() => {
                track("hero_cta_click", { variant: "horizon-v2" });
                open({ source: "hero-horizon" });
              }}
              className="group inline-flex h-[52px] items-center gap-2.5 bg-[#FF3333] px-9 text-[0.9375rem] font-semibold text-white shadow-[0_0_30px_rgb(255_51_51/0.2)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:bg-[#ff4d4d] hover:shadow-[0_4px_40px_rgb(255_51_51/0.35)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transform-none motion-reduce:transition-none"
            >
              Start Your Project
              <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
              </svg>
            </button>
            <Link
              href="/case-studies"
              onClick={() => track("explore_work_click", { variant: "horizon-v2" })}
              style={{ borderRadius: 3 }}
              className="inline-flex h-[52px] items-center border border-white/18 bg-white/[0.04] px-9 text-[0.9375rem] font-semibold text-white backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:border-white/40 hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transform-none motion-reduce:transition-none"
            >
              Explore Our Work
            </Link>
          </div>
        </div>
      </section>

      <LogoMarquee />
    </>
  );
}
