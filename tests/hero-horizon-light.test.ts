import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHorizonCluster, horizonLightPoint, starSparkle } from '../src/sections/home-v2/hero-star-motion';

const desktop = { centerX: 720, centerY: 1106.8, radiusX: 1224, radiusY: 532.8 };
describe('Responsive horizon light', () => {
  it('starts at the apex, with a horizontal tangent', () => {
    const p = horizonLightPoint(.5, 1440, desktop);
    expect(p.x).toBe(720); expect(p.y).toBeCloseTo(574); expect(p.tangent).toBe(0);
  });
  it.each([
    [1440, desktop],
    [390, { centerX: 195, centerY: 938.75, radiusX: 399.75, radiusY: 282.75 }],
    [768, { centerX: 384, centerY: 1086.4, radiusX: 729.6, radiusY: 403.2 }],
  ] as const)('follows the true ellipse and correct slope at width %s', (width, ellipse) => {
    for (const pointer of [0, .2, .5, .8, 1]) {
      const p = horizonLightPoint(pointer, width, ellipse);
      expect(((p.x-ellipse.centerX)/ellipse.radiusX)**2 + ((p.y-ellipse.centerY)/ellipse.radiusY)**2).toBeCloseTo(1, 10);
      expect(p.y).toBeLessThan(ellipse.centerY);
      expect(p.x).toBeGreaterThan(0); expect(p.x).toBeLessThan(width);
    }
    const left = horizonLightPoint(.2, width, ellipse), right = horizonLightPoint(.8, width, ellipse);
    expect(left.y).toBeCloseTo(right.y, 10); expect(left.tangent).toBeLessThan(0); expect(right.tangent).toBeGreaterThan(0);
    const near = horizonLightPoint(.20001, width, ellipse);
    expect(Math.atan2(near.y-left.y, near.x-left.x)).toBeCloseTo(left.tangent, 4);
  });
  it('clamps pointer input and handles non-finite input as centered', () => {
    expect(horizonLightPoint(-100, 1440, desktop)).toEqual(horizonLightPoint(0, 1440, desktop));
    expect(horizonLightPoint(100, 1440, desktop)).toEqual(horizonLightPoint(1, 1440, desktop));
    expect(horizonLightPoint(NaN, 1440, desktop)).toEqual(horizonLightPoint(.5, 1440, desktop));
  });
});
describe('Denser central horizon cloud', () => {
  it.each([320,390,768,1440,1920])('stays above the horizon and below content at width %s', width => {
    const stars = createHorizonCluster(width, 600, 480);
    expect(stars.length).toBeGreaterThan(15); expect(stars.length).toBeLessThanOrEqual(width < 768 ? 24 : 52);
    for (const s of stars) {
      expect(s.x).toBeGreaterThan(width * .22); expect(s.x).toBeLessThan(width * .78);
      expect(s.y).toBeGreaterThanOrEqual(484); expect(s.y).toBeLessThanOrEqual(584);
      expect(s.period).toBeGreaterThanOrEqual(5000); expect(s.period).toBeLessThan(9500);
      expect(s.anchorX).toBe(s.x); expect(s.anchorY).toBe(s.y);
    }
  });
  it('is deterministic, organic and has a sparse bright subset', () => {
    const a=createHorizonCluster(1440,600,480), b=createHorizonCluster(1440,600,480);
    expect(a).toEqual(b); expect(new Set(a.map(s=>s.y)).size).toBe(a.length);
    expect(a.filter(s=>s.sparkles).length).toBe(8); expect(new Set(a.map(s=>s.phase)).size).toBe(a.length);
    expect(a.some(s=>s.radius<.5)).toBe(true); expect(a.some(s=>s.radius>1)).toBe(true);
  });
  it('does not force stars into a crowded content gap or zero-size scene', () => {
    expect(createHorizonCluster(390,500,490)).toEqual([]); expect(createHorizonCluster(0,600,400)).toEqual([]);
  });
});
describe('Photographic sparkle and render budget', () => {
  it('has localized gentle peaks, no synchronized on/off states', () => {
    expect(starSparkle(Math.PI/2,false)).toBe(1); expect(starSparkle(Math.PI*1.5,false)).toBe(0);
    expect(starSparkle(0,false)).toBeLessThan(.001);
    for(let i=0;i<120;i++) {
      const p=i*Math.PI*2/120;
      expect(Math.abs(starSparkle(p+.034,false)-starSparkle(p,false))).toBeLessThan(.05);
    }
  });
  it('removes all glints under reduced motion', () => {
    for (const phase of [0,Math.PI/2,Math.PI,Math.PI*1.5]) expect(starSparkle(phase,true)).toBe(0);
  });
  it('uses one decorative canvas, cached sprites and no per-frame geometry reads', () => {
    const source=readFileSync('src/sections/home-v2/hero.tsx','utf8');
    expect(source.match(/<canvas /g)).toHaveLength(1);
    const draw=source.slice(source.indexOf('function draw(delta:'),source.indexOf('function frame(now:'));
    expect(draw).not.toContain('getBoundingClientRect'); expect(draw).not.toContain('document.createElement');
    expect(draw).toContain('context!.clip("evenodd")');
    expect(draw).not.toContain('createRadialGradient');
    expect(draw).toContain('only the original soft rim masks and halo move');
    expect(source).toContain('pointer.removeEventListener("change", onPointerChange)');
    const css=readFileSync('src/sections/home-v2/hero.module.css','utf8');
    expect(css).toContain('rotate(var(--sun-angle))'); expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    // Owner-pinned original illumination: no new harsh core, opacity or palette.
    for (const original of ['border: 1.5px solid rgb(255 200 178 / 0.95)', 'border: 4px solid rgb(255 91 59 / 0.8)', 'filter: blur(4px)', 'border: 20px solid rgb(247 57 37 / 0.5)', 'filter: blur(18px)', 'border: 36px solid rgb(225 43 30 / 0.3)', 'filter: blur(44px)', 'rgb(255 93 59 / 0.4)', 'rgb(255 51 51 / 0.2)', 'rgb(227 40 30 / 0.06)']) expect(css).toContain(original);
    expect(css).toContain('calc(48% + var(--sun-mask-shift))');
    expect(css).not.toContain('--horizon-opacity');
  });
});
