// src/infrastructure/realtime/websocket.ts

import { WebSocket, WebSocketServer } from "ws";
import { z } from "zod";
import { RealtimeEvent } from "./event.types.js";
import { ensureProjectMember } from "../../modules/project/project.authorization.js";

/**
 * Singleton WebSocket server instance.
 *
 * The HTTP server attaches to this instance during
 * application startup.
 */
export const websocket = new WebSocketServer({
  noServer: true,
});

/**
 * Tracks which projects each connected client is subscribed to.
 *
 * One WebSocket connection can subscribe to multiple projects.
 */
export const subscriptions = new Map<WebSocket, Set<string>>();

/** Tracks authenticated user per socket (set by server upgrade handler). */
export const socketUsers = new WeakMap<WebSocket, string>();

const MAX_SUBSCRIPTIONS_PER_SOCKET = 10;

const subscribeSchema = z.object({
  type: z.literal("project.subscribe"),
  data: z.object({ projectId: z.string().min(1).max(100) }),
});

const unsubscribeSchema = z.object({
  type: z.literal("project.unsubscribe"),
  data: z.object({ projectId: z.string().min(1).max(100) }),
});

function sendError(socket: WebSocket, code: string, message: string) {
  if (socket.readyState !== WebSocket.OPEN) return;
  try {
    socket.send(JSON.stringify({ type: "error", error: { code, message } }));
  } catch {
    // ignore send failures
  }
}

websocket.on("connection", (socket) => {
  console.info("WebSocket client connected.");

  // Heartbeat to detect stale connections
  let isAlive = true;
  (socket as any).isAlive = true;
  socket.on("pong", () => {
    isAlive = true;
    (socket as any).isAlive = true;
  });

  socket.on("message", async (rawMessage) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawMessage.toString());
    } catch {
      sendError(socket, "INVALID_MESSAGE", "Invalid JSON");
      return;
    }

    const userId = socketUsers.get(socket);
    if (!userId) {
      sendError(socket, "UNAUTHORIZED", "Not authenticated");
      return;
    }

    // Try subscribe schema
    const subResult = subscribeSchema.safeParse(parsed);
    if (subResult.success) {
      const projectId = subResult.data.data.projectId;
      try {
        await ensureProjectMember(projectId, userId);
      } catch {
        sendError(socket, "FORBIDDEN", "Not authorized for project");
        return;
      }

      let projectSubscriptions = subscriptions.get(socket);
      if (!projectSubscriptions) {
        projectSubscriptions = new Set<string>();
        subscriptions.set(socket, projectSubscriptions);
      }

      if (projectSubscriptions.size >= MAX_SUBSCRIPTIONS_PER_SOCKET) {
        sendError(socket, "LIMIT_EXCEEDED", "Subscription limit exceeded");
        return;
      }

      projectSubscriptions.add(projectId);
      console.info(`Client ${userId} subscribed to project ${projectId}`);
      return;
    }

    const unsubResult = unsubscribeSchema.safeParse(parsed);
    if (unsubResult.success) {
      const projectId = unsubResult.data.data.projectId;
      const projectSubscriptions = subscriptions.get(socket);
      if (!projectSubscriptions) return;
      if (!projectSubscriptions.has(projectId)) return;
      projectSubscriptions.delete(projectId);
      console.info(`Client ${userId} unsubscribed from project ${projectId}`);
      return;
    }

    sendError(socket, "INVALID_MESSAGE", "Unknown message type");
  });

  socket.on("close", () => {
    subscriptions.delete(socket);
    socketUsers.delete(socket);
    console.info("WebSocket client disconnected.");
  });

  socket.on("error", () => {
    subscriptions.delete(socket);
    socketUsers.delete(socket);
  });
});

// Heartbeat interval — terminate stale sockets every 30s
setInterval(() => {
  for (const client of websocket.clients) {
    const sock = client as WebSocket & { isAlive?: boolean };
    if (sock.isAlive === false) {
      subscriptions.delete(sock);
      socketUsers.delete(sock);
      try {
        sock.terminate();
      } catch {}
      continue;
    }
    sock.isAlive = false;
    try {
      sock.ping();
    } catch {}
  }
}, 30_000).unref();

export function isSocketAlive(socket: WebSocket): boolean {
  return (socket as any).isAlive !== false;
}
