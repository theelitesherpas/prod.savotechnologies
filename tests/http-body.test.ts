import { describe, expect, it } from "vitest";
import { readBodyBytes } from "@/lib/http-body";
import { isJsonRequest, readJsonBody } from "@/lib/api";

function request(body: string | Uint8Array<ArrayBuffer>, headers?: HeadersInit) {
  return new Request("https://example.test/api/test", { method: "POST", body, headers });
}

function streamed(chunks: Uint8Array<ArrayBuffer>[], headers?: HeadersInit) {
  let cancelled = false;
  let reads = 0;
  const body = new ReadableStream<Uint8Array<ArrayBuffer>>({
    pull(controller) {
      reads += 1;
      const chunk = chunks.shift();
      if (chunk) controller.enqueue(chunk);
      else controller.close();
    },
    cancel() { cancelled = true; },
  });
  return { input: { body, headers: new Headers(headers) }, cancelled: () => cancelled, reads: () => reads };
}

const bytes = (text: string) => new TextEncoder().encode(text);

describe("bounded request bodies", () => {
  it("accepts an exact byte-limit body", async () => {
    const result = await readBodyBytes(request("12345"), 5);
    expect(result.ok).toBe(true);
    if (result.ok) expect(new TextDecoder().decode(result.bytes)).toBe("12345");
  });

  it("rejects oversized Content-Length before reading", async () => {
    const input = streamed([bytes("x")], { "content-length": "1000" });
    expect(await readBodyBytes(input.input, 20)).toEqual({ ok: false, reason: "too_large" });
    expect(input.cancelled()).toBe(true);
  });

  it.each(["-1", "1.5", "unknown"])("rejects malformed advertised size %s", async size => {
    expect(await readBodyBytes(request("x", { "content-length": size }), 20)).toEqual({ ok: false, reason: "invalid" });
  });

  it("counts chunked bodies even without Content-Length and cancels overflow", async () => {
    const input = streamed([bytes("123"), bytes("456"), bytes("789"), bytes("overflow")]);
    expect(await readBodyBytes(input.input, 5)).toEqual({ ok: false, reason: "too_large" });
    expect(input.cancelled()).toBe(true);
    expect(input.reads()).toBeLessThan(5);
  });

  it("does not trust a forged small Content-Length", async () => {
    expect(await readBodyBytes(request("123456789", { "content-length": "1" }), 5)).toEqual({ ok: false, reason: "too_large" });
  });

  it("limits UTF-8 bytes rather than JavaScript character count", async () => {
    const body = JSON.stringify({ x: "🌍🌍" });
    expect(body.length).toBeLessThan(bytes(body).length);
    expect((await readJsonBody(request(body), body.length)).ok).toBe(false);
    expect((await readJsonBody(request(body), bytes(body).length)).ok).toBe(true);
  });

  it("default envelope accommodates validated long multilingual project messages", async () => {
    const data = { name: "Applicant", email: "applicant@example.test", projectType: "Website", message: "界".repeat(4000), source: "start-page" };
    expect(await readJsonBody(request(JSON.stringify(data)))).toEqual({ ok: true, data });
    expect((await readJsonBody(request(JSON.stringify({ message: "x".repeat(32_001) })))).ok).toBe(false);
  });

  it("decodes UTF-8 split across network chunks", async () => {
    const data = bytes('{"x":"🌍"}');
    const input = streamed([data.slice(0, 8), data.slice(8, 10), data.slice(10)]);
    const result = await readBodyBytes(input.input, 50);
    expect(result.ok).toBe(true);
    if (result.ok) expect(JSON.parse(new TextDecoder().decode(result.bytes))).toEqual({ x: "🌍" });
  });

  it("bounds a stalled stream by deadline and cancels it", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array<ArrayBuffer>>({ cancel() { cancelled = true; } });
    expect(await readBodyBytes({ body, headers: new Headers() }, 50, 15)).toEqual({ ok: false, reason: "timeout" });
    expect(cancelled).toBe(true);
  });

  it("handles stream errors without throwing", async () => {
    const body = new ReadableStream<Uint8Array<ArrayBuffer>>({ start(controller) { controller.error(new Error("private upstream details")); } });
    expect(await readBodyBytes({ body, headers: new Headers() }, 50)).toEqual({ ok: false, reason: "invalid" });
  });

  it.each([0, -1, 1.5, Number.NaN])("rejects invalid configured limit %s", async limit => {
    expect((await readBodyBytes(request("x"), limit)).ok).toBe(false);
  });

  it("rejects invalid UTF-8 instead of accepting replacement characters", async () => {
    expect(await readJsonBody(request(new Uint8Array([123, 34, 120, 34, 58, 34, 255, 34, 125])))).toEqual({ ok: false });
  });

  it("treats an absent/empty JSON body as invalid JSON", async () => {
    expect(await readJsonBody(new Request("https://example.test"))).toEqual({ ok: false });
  });

  it.each(["application/jsonp", "text/plain; application/json", "application/json-evil"])("rejects media-type spoofing: %s", type => {
    expect(isJsonRequest(request("{}", { "content-type": type }))).toBe(false);
  });

  it("accepts JSON with charset/case variations", () => {
    expect(isJsonRequest(request("{}", { "content-type": "Application/JSON; charset=utf-8" }))).toBe(true);
  });
});
