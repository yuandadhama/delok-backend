// /src/infrastructure/realtime/websocket.ts

import { WebSocketServer } from "ws";

/**
 * Singleton WebSocket server instance.
 *
 * The HTTP server attaches to this instance during
 * application startup.
 */
export const websocket = new WebSocketServer({
  noServer: true,
});

websocket.on("connection", (socket) => {
  console.info("WebSocket client connected.");

  socket.on("close", () => {
    console.info("WebSocket client disconnected.");
  });
});
