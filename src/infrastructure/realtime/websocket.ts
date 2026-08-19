// src/infrastructure/realtime/websocket.ts

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
 * Tracks which projects each connected client is subscribed to.
 *
 * One WebSocket connection can subscribe to multiple projects.
 */
export const subscriptions = new Map<WebSocket, Set<string>>();

websocket.on("connection", (socket) => {
  console.info("WebSocket client connected.");

  socket.on("message", (rawMessage) => {
    try {
      const message: RealtimeEvent = JSON.parse(rawMessage.toString());

      if (message.type === "project.subscribe") {
        const projectId = message.data.projectId;

        let projectSubscriptions = subscriptions.get(socket);

        if (!projectSubscriptions) {
          projectSubscriptions = new Set<string>();

          subscriptions.set(socket, projectSubscriptions);
        }

        projectSubscriptions.add(projectId);

        console.info(`Client subscribed to project ${projectId}`);
      }

      if (message.type === "project.unsubscribe") {
        const projectId = message.data.projectId;

        const projectSubscriptions = subscriptions.get(socket);

        if (!projectSubscriptions) {
          return;
        }

        if (!projectSubscriptions.has(projectId)) {
          return;
        }

        projectSubscriptions.delete(projectId);

        console.info(`Client unsubscribed from project ${projectId}`);
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
