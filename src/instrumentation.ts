/**
 * Next.js server bootstrap — starts the live-chat background worker
 * (response-window timeouts, visitor disconnects, presence decay) exactly
 * once per server process, before the first request is handled.
 */

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startLiveChatWorker } = await import("@/lib/livechat/worker");
  startLiveChatWorker();
}
