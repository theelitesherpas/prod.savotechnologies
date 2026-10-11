import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearRateLimit, RATE_LIMIT_CAPACITY, rateCount, rateLimit } from "@/lib/rate-limit";
import { clearLoginFailures, loginCaptchaRequired, recordLoginFailure } from "@/lib/captcha";
const state = (globalThis as unknown as { __savoRateLimiterV2: { buckets: Map<string, unknown>; nextSweep: number } }).__savoRateLimiterV2;
beforeEach(() => { state.buckets.clear(); state.nextSweep = 0; vi.useFakeTimers(); vi.setSystemTime(100_000); });
afterEach(() => { state.buckets.clear(); vi.useRealTimers(); });
describe("hard-bounded local limiter", () => {
 it("expires at the exact window boundary", () => {
  rateLimit("a", 1, 1000); expect(rateLimit("a",1,1000).ok).toBe(false);
  vi.advanceTimersByTime(1000); expect(rateLimit("a",1,1000).ok).toBe(true);
 });
 it("read-only counts never register hits", () => {
  expect(rateCount("a",1000)).toBe(0);rateLimit("a",2,1000);
  expect(rateCount("a",1000)).toBe(1);expect(rateCount("a",1000)).toBe(1);
 });
 it("clears one key immediately, without changing another", () => {
  rateLimit("a",1,1000);rateLimit("b",1,1000);clearRateLimit("a");
  expect(rateCount("a",1000)).toBe(0);expect(rateLimit("b",1,1000).ok).toBe(false);
 });
 it("successful login clears progressive CAPTCHA even in the same millisecond", () => {
  recordLoginFailure("admin","ip");recordLoginFailure("admin","ip");expect(loginCaptchaRequired("admin","ip")).toBe(true);
  clearLoginFailures("admin","ip");expect(loginCaptchaRequired("admin","ip")).toBe(false);
  recordLoginFailure("admin","ip");expect(loginCaptchaRequired("admin","ip")).toBe(false);
 });
 it("retains active windows and fails closed at capacity", () => {
  for(let i=0;i<RATE_LIMIT_CAPACITY;i++) expect(rateLimit(`key-${i}`,1,60_000).ok).toBe(true);
  for(let i=0;i<100;i++) expect(rateLimit(`overflow-${i}`,1,60_000).ok).toBe(false);
  expect(state.buckets.size).toBe(RATE_LIMIT_CAPACITY);
  expect(rateLimit("key-0",1,60_000).ok).toBe(false);expect(rateCount("overflow",60_000)).toBeGreaterThan(1);
 });
 it("capacity cleanup uses each bucket's own TTL", () => {
  rateLimit("long",1,86_400_000);
  for(let i=1;i<RATE_LIMIT_CAPACITY;i++)rateLimit(`short-${i}`,1,1000);
  vi.advanceTimersByTime(2000);expect(rateLimit("new",1,1000).ok).toBe(true);
  expect(state.buckets.size).toBe(2);expect(rateLimit("long",1,86_400_000).ok).toBe(false);
 });
 it("conflicting policies cannot reset a bucket", () => {
  rateLimit("a",1,60_000);expect(rateLimit("a",10,1000).ok).toBe(false);expect(rateCount("a",1000)).toBeGreaterThan(1);
  expect(rateLimit("a",1,60_000).ok).toBe(false);
 });
 it.each([0,-1,NaN,Infinity,1.5,1001])("rejects invalid limit %s without allocation", limit => {
  expect(rateLimit("bad",limit,1000).ok).toBe(false);expect(state.buckets.size).toBe(0);
 });
 it.each([0,-1,NaN,Infinity,1.5,8*86_400_000])("rejects invalid window %s", window => {
  expect(rateLimit("bad",1,window).ok).toBe(false);expect(state.buckets.size).toBe(0);
 });
 it.each(["", "x".repeat(513)])("rejects unbounded keys", key => { expect(rateLimit(key).ok).toBe(false);expect(state.buckets.size).toBe(0); });
 it("caps accepted hits per bucket", () => {
  for(let i=0;i<1000;i++)rateLimit("cap",1000,60_000);
  for(let i=0;i<1000;i++)expect(rateLimit("cap",1000,60_000).ok).toBe(false);
  expect(rateCount("cap",60_000)).toBe(1000);
 });
});
