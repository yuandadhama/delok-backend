// /src/infrastructure/realtime/websocket.ts

import { WebSocket, WebSocketServer } from "ws";
import { RealtimeEvent } from "./event.types";

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
 * Tracks which project each connected client is subscribed to.
 *
 * Key   : WebSocket client connection
 * Value : Project ID
 */
export const subscriptions = new Map<WebSocket, string>();

websocket.on("connection", (socket) => {
  console.info("WebSocket client connected.");

  socket.on("message", (rawMessage) => {
    try {
      const message: RealtimeEvent = JSON.parse(rawMessage.toString());

      if (message.type === "project.subscribe") {
        subscriptions.set(socket, message.data.projectId);

        console.info(`Client subscribed to project ${message.data.projectId}`);
      }
    } catch {
      console.warn("Invalid websocket message.");
    }
  });
  socket.on("close", () => {
    subscriptions.delete(socket);
    console.info("WebSocket client disconnected.");
  });
});
