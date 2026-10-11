import { afterEach, describe, expect, it, vi } from "vitest";
const worker = vi.hoisted(() => vi.fn());
vi.mock("@/lib/livechat/worker", () => ({ startLiveChatWorker: worker }));
import { register } from "@/instrumentation";
afterEach(() => { vi.unstubAllEnvs(); worker.mockClear(); });
describe("runtime-specific instrumentation", () => {
  it("starts the existing worker on Node", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs"); await register(); expect(worker).toHaveBeenCalledOnce();
  });
  it.each(["edge", "", "unknown"])("does not start Node integrations in %s runtime", async runtime => {
    vi.stubEnv("NEXT_RUNTIME", runtime); await register(); expect(worker).not.toHaveBeenCalled();
  });
});
