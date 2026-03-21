// app/api/caller-leads/events/route.ts
import { NextRequest } from "next/server";
import pkg from "pg";
const { Pool } = pkg;

// ─────────────────────────────────────────────
// One persistent pool for NOTIFY calls only
// (each SSE connection gets its own dedicated client for LISTEN)
// ─────────────────────────────────────────────
const notifyPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 5,
});

// ─────────────────────────────────────────────
// broadcastUpdate — called from all other routes
// Uses pg_notify so it works across multiple server instances
// ─────────────────────────────────────────────
export async function broadcastUpdate(data: object) {
  const payload = JSON.stringify(data);

  // pg_notify has an 8000 byte limit — guard against oversized payloads
  if (Buffer.byteLength(payload, "utf8") > 7800) {
    console.warn("[broadcastUpdate] Payload too large, skipping notify:", payload.length);
    return;
  }

  const client = await notifyPool.connect();
  try {
    await client.query(`SELECT pg_notify('caller_leads_updates', $1)`, [payload]);
  } catch (err: any) {
    console.error("[broadcastUpdate] pg_notify failed:", err.message);
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────
// GET — SSE endpoint, one persistent DB client per browser connection
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  // Each SSE connection gets its own dedicated pool + client for LISTEN
  // This is required — LISTEN state is per-connection in PostgreSQL
  const listenPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    max: 1,
  });

  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let dbClient: pkg.PoolClient | null = null;
  let streamController: ReadableStreamDefaultController | null = null;

  const cleanup = async () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (dbClient) {
      try {
        await dbClient.query("UNLISTEN *");
        dbClient.release();
      } catch {}
    }
    try { await listenPool.end(); } catch {}
  };

  const stream = new ReadableStream({
    async start(ctrl) {
      streamController = ctrl;

      try {
        dbClient = await listenPool.connect();

        // Listen on the shared channel
        await dbClient.query("LISTEN caller_leads_updates");

        // Forward any DB notification to this SSE client
        dbClient.on("notification", (msg) => {
          if (!msg.payload) return;
          try {
            ctrl.enqueue(`data: ${msg.payload}\n\n`);
          } catch {
            // Client disconnected — clean up
            cleanup();
          }
        });

        // Handle unexpected DB client errors (network drop, etc.)
        dbClient.on("error", async (err) => {
          console.error("[SSE] DB client error:", err.message);
          await cleanup();
          try { ctrl.close(); } catch {}
        });

        // Send initial connected event
        ctrl.enqueue(
          `data: ${JSON.stringify({ type: "connected", ts: Date.now() })}\n\n`
        );

        // Heartbeat every 25s — prevents proxy/nginx/Vercel killing idle connections
        heartbeatTimer = setInterval(() => {
          try {
            ctrl.enqueue(`: heartbeat\n\n`);
          } catch {
            cleanup();
          }
        }, 25_000);

      } catch (err: any) {
        console.error("[SSE] Failed to connect to DB:", err.message);
        try {
          ctrl.enqueue(
            `data: ${JSON.stringify({ type: "error", message: "SSE setup failed" })}\n\n`
          );
          ctrl.close();
        } catch {}
        await cleanup();
      }
    },

    cancel() {
      // Browser tab closed / client navigated away
      cleanup();
    },
  });

  // Handle server-side request abort (e.g. client hard-disconnects)
  req.signal.addEventListener("abort", () => {
    cleanup();
    try { streamController?.close(); } catch {}
  });

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache, no-transform",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no", // Disables nginx response buffering
    },
  });
}