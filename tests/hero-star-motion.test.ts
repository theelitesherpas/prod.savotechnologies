import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { advanceGalaxyStar, STAR_DRIFT_PX_PER_SECOND } from '../src/sections/home-v2/hero-star-motion';
const advance = (depth: number, frames = 60) => {
  const star = { x: 720, y: 120, depth };
  for (let i = 0; i < frames; i++) advanceGalaxyStar(star, 1440, 754, 1000 / frames);
  return star;
};
describe('Homepage galaxy star drift', () => {
  it('moves visibly clockwise without requiring pointer input', () => {
    const star = advance(2);
    expect(star.x).toBeGreaterThan(740);
    expect(star.y).toBeGreaterThan(120);
  });
  it('makes nearer stars move faster, with a restrained 8–22px/sec speed range', () => {
    expect(STAR_DRIFT_PX_PER_SECOND).toEqual([8, 14, 22]);
    expect(advance(0).x).toBeLessThan(advance(1).x);
    expect(advance(1).x).toBeLessThan(advance(2).x);
  });
  it('is consistent across the existing 30fps mobile/60fps desktop loops', () => {
    const a = advance(1, 30), b = advance(1, 60);
    expect(a.x).toBeCloseTo(b.x, 8); expect(a.y).toBeCloseTo(b.y, 8);
  });
  it('keeps elliptical distance stable until a particle leaves the canvas margin', () => {
    const star = { x: 820, y: 180, depth: 1 };
    const radius = () => Math.hypot(star.x - 720, (star.y - 754 * .45) / .68);
    const before = radius(); advanceGalaxyStar(star, 1440, 754, 50);
    expect(radius()).toBeCloseTo(before, 8);
  });
  it('recycles outside the parallax-safe margin and never clamps into a visible row', () => {
    const star = { x: 1800, y: -200, depth: 2 }; advanceGalaxyStar(star, 1440, 754, 16);
    expect(star.x).toBeGreaterThanOrEqual(-32); expect(star.x).toBeLessThanOrEqual(1472);
    expect(star.y).toBeGreaterThanOrEqual(-32); expect(star.y).toBeLessThanOrEqual(786);
    expect(star.x).not.toBe(0); expect(star.y).not.toBe(0);
  });
  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('does not move for an invalid or static delta %s', delta => {
    const star = { x: 10, y: 20, depth: 0 }; advanceGalaxyStar(star, 390, 700, delta);
    expect(star).toEqual({ x: 10, y: 20, depth: 0 });
  });
  it('handles a center particle and zero-size layout without invalid coordinates', () => {
    const center = { x: 195, y: 315, depth: 2 }; advanceGalaxyStar(center, 390, 700, 16);
    expect(center).toEqual({ x: 195, y: 315, depth: 2 });
    advanceGalaxyStar(center, 0, 0, 16); expect(Number.isFinite(center.x)).toBe(true);
  });
  it('retains reduced motion, offscreen/tab sleeping, frame cap and cleanup in the real hero', () => {
    const source = readFileSync('src/sections/home-v2/hero.tsx', 'utf8');
    expect(source).toContain('if (!motion.matches) advanceGalaxyStar(star, width, height, delta)');
    expect(source).toContain('lastFrame ? now - lastFrame : (width < 768 ? 32 : 16)');
    expect(source).toMatch(/if \(motion\.matches\) \{[\s\S]*?draw\(0\);/);
    for (const contract of ['if (!inView || document.hidden) return', 'draw(Math.min(elapsed, 50))', 'motion.addEventListener("change", syncAnimation)', 'intersection.disconnect()', 'observer.disconnect()']) expect(source).toContain(contract);
  });
});
