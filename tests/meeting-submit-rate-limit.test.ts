import { beforeEach, describe, expect, it, vi } from "vitest";

const submit = vi.hoisted(() => vi.fn());
vi.mock("@/lib/meeting/service", () => ({ submitAvailability: submit }));

import { POST } from "@/app/api/meeting/submit/route";

beforeEach(() => {
  vi.clearAllMocks();
  submit.mockResolvedValue({ ok: true, reference: "synthetic-reference" });
});

describe("public meeting submission ingress limits", () => {
  it("limits by client IP even when each request invents a different token", async () => {
    const ip = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
    const request = (index: number) => new Request("https://example.test/api/meeting/submit", {
      method: "POST",
      headers: { "content-type": "application/json", "x-real-ip": ip },
      body: JSON.stringify({ token: `synthetic-token-${index}`, preferredDate: "2030-10-15", preferredTime: "10:00" }),
    });

    for (let index = 0; index < 20; index += 1) {
      expect((await POST(request(index))).status).toBe(200);
    }
    const blocked = await POST(request(20));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
    expect(submit).toHaveBeenCalledTimes(20);
  });
});
