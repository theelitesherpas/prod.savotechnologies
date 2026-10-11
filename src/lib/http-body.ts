/** Bounded Web Request body reader. Limits bytes while streaming, not after buffering. */
export type BodyReadResult =
  | { ok: true; bytes: Uint8Array<ArrayBuffer> }
  | { ok: false; reason: "too_large" | "invalid" | "timeout" };

export async function readBodyBytes(
  req: Pick<Request, "body" | "headers">,
  maxBytes: number,
  timeoutMs = 10_000,
): Promise<BodyReadResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || !Number.isFinite(timeoutMs) || timeoutMs < 1) {
    return { ok: false, reason: "invalid" };
  }
  const length = req.headers.get("content-length");
  if (length !== null) {
    if (!/^\d+$/.test(length)) return { ok: false, reason: "invalid" };
    if (Number(length) > maxBytes) {
      void req.body?.cancel().catch(() => undefined);
      return { ok: false, reason: "too_large" };
    }
  }
  if (!req.body) return { ok: true, bytes: new Uint8Array(0) };

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let finished = false;
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      reject(new Error("BODY_TIMEOUT"));
    }, timeoutMs);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) {
        finished = true;
        break;
      }
      total += value.byteLength;
      if (total > maxBytes) return { ok: false, reason: "too_large" };
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { ok: true, bytes };
  } catch {
    return { ok: false, reason: timedOut ? "timeout" : "invalid" };
  } finally {
    clearTimeout(timer);
    if (!finished) void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
