import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import { verifyToken } from "@clerk/backend";
import { env } from "./config/env.js";

let io: SocketIOServer | null = null;

/**
 * Pushes a real-time event to every connection a given user has open (they join a
 * room keyed by their own clerkId on connect). A no-op before initRealtime() has run,
 * so callers never need to guard for that themselves.
 */
export function emitToUser(clerkId: string, event: string, payload: unknown): void {
  io?.to(`user:${clerkId}`).emit(event, payload);
}

/**
 * One Socket.IO server attached to the same HTTP server Express listens on. Railway
 * runs a single replica today, so an in-memory room map (Socket.IO's default) is
 * correct — if this ever scales to multiple replicas, rooms stop being visible across
 * processes and a shared adapter (e.g. @socket.io/redis-adapter) becomes necessary.
 */
export function initRealtime(httpServer: HttpServer): void {
  io = new SocketIOServer(httpServer, {
    // Mirrors the permissive Express cors() already in front of the REST API —
    // Socket.IO doesn't inherit that middleware, it needs its own CORS config.
    cors: { origin: true },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error("Unauthorized"));
      return;
    }
    try {
      const payload = await verifyToken(token, { secretKey: env.clerkSecretKey });
      socket.data.clerkId = payload.sub;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const clerkId = socket.data.clerkId as string;
    socket.join(`user:${clerkId}`);

    // Typing has no persistence at all now (see messageService.ts) — it's a pure live
    // relay between the two people in a conversation, gone the instant nobody's
    // listening, instead of a DB row read back by a poll.
    socket.on("typing", ({ toClerkId }: { toClerkId?: string }) => {
      if (!toClerkId) return;
      emitToUser(toClerkId, "typing", { fromClerkId: clerkId });
    });
  });
}
