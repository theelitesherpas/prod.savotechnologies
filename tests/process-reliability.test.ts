import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const m=vi.hoisted(()=>({sweep:vi.fn(),presence:vi.fn(),construct:vi.fn()}));
vi.mock("@/lib/livechat/service",()=>({sweepOnce:m.sweep}));
vi.mock("@/lib/livechat/pubsub",()=>({publish:vi.fn()}));
vi.mock("@prisma/client",()=>({PrismaClient:class{constructor(options:unknown){m.construct(options);}agentPresence={findMany:m.presence};}}));
const g=globalThis as unknown as {prisma?:unknown;__liveChatSweep?:ReturnType<typeof setInterval>;__liveChatSweepTick?:number;__liveChatSweepRunning?:boolean};
beforeEach(()=>{vi.resetModules();vi.clearAllMocks();delete g.prisma;delete g.__liveChatSweep;delete g.__liveChatSweepTick;delete g.__liveChatSweepRunning;vi.stubEnv("DATABASE_URL","postgresql://fake:fake@localhost/test?connection_limit=2&pool_timeout=10");m.presence.mockResolvedValue([]);});
afterEach(()=>{if(g.__liveChatSweep)clearInterval(g.__liveChatSweep);delete g.prisma;delete g.__liveChatSweep;delete g.__liveChatSweepTick;delete g.__liveChatSweepRunning;vi.useRealTimers();vi.unstubAllEnvs();});
describe("process-local reliability",()=>{
 it("reuses one production Prisma client across module reloads",async()=>{vi.stubEnv("NODE_ENV","production");const first=await import("@/lib/prisma");vi.resetModules();const second=await import("@/lib/prisma");expect(first.prisma).toBe(second.prisma);expect(m.construct).toHaveBeenCalledTimes(1);expect(m.construct.mock.calls[0][0]).toMatchObject({log:[]});});
 it("does not instantiate Prisma without a database",async()=>{vi.stubEnv("DATABASE_URL","");const {prisma}=await import("@/lib/prisma");expect(prisma).toBeNull();expect(m.construct).not.toHaveBeenCalled();});
 it("does not overlap slow sweeps and resumes after completion",async()=>{
  vi.useFakeTimers();let release!:()=>void;m.sweep.mockReturnValue(new Promise<void>(r=>{release=r;}));const {startLiveChatWorker}=await import("@/lib/livechat/worker");startLiveChatWorker();startLiveChatWorker();await vi.advanceTimersByTimeAsync(20_000);expect(m.sweep).toHaveBeenCalledTimes(1);
  release();await vi.advanceTimersByTimeAsync(0);m.sweep.mockResolvedValue(undefined);await vi.advanceTimersByTimeAsync(5_000);expect(m.sweep).toHaveBeenCalledTimes(2);expect(g.__liveChatSweepRunning).toBe(false);
 });
 it("a failed sweep releases the in-flight guard",async()=>{vi.useFakeTimers();m.sweep.mockRejectedValue(new Error("DB unavailable"));const {startLiveChatWorker}=await import("@/lib/livechat/worker");startLiveChatWorker();await vi.advanceTimersByTimeAsync(10_000);expect(m.sweep).toHaveBeenCalledTimes(2);expect(g.__liveChatSweepRunning).toBe(false);});
});
