/**
 * Next.js server bootstrap - starts the live-chat background worker
 * (response-window timeouts, visitor disconnects, presence decay) exactly
 * once per server process, before the first request is handled.
 */

export async function register(): Promise<void> {
  // Keep the import inside a positive runtime branch so both bundlers can
  // eliminate Node-only mail/database dependencies from the Edge build.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startLiveChatWorker } = await import("@/lib/livechat/worker");
    startLiveChatWorker();
  }
}
