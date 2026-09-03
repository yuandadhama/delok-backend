// /src/server.ts

import { createServer } from "node:http";
import { env } from "./lib/env.js";
import { prisma } from "./lib/prisma.js";

import { app } from "./app.js";
import { websocket, socketUsers } from "./infrastructure/realtime/websocket.js";
import { auth } from "./lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

export const server = createServer(app);

server.on("upgrade", async (request, socket, head) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers as any),
    });

    if (!session?.user?.id) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    websocket.handleUpgrade(request, socket, head, (client) => {
      socketUsers.set(client, session.user.id);
      (client as any).userId = session.user.id;
      websocket.emit("connection", client, request);
    });
  } catch {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
  }
});

const PORT = env.PORT;
const HOST = "0.0.0.0";

server.listen(PORT, HOST, () => {
  console.info(`Server listening at http://${HOST}:${PORT} [${env.NODE_ENV}]`);
});

// Graceful shutdown
let shuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`Received ${signal}, shutting down gracefully...`);

  const timeout = setTimeout(() => {
    console.error("Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 10_000);
  timeout.unref();

  try {
    // Stop accepting new connections
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });

    // Close all websocket clients
    for (const client of websocket.clients) {
      try {
        client.close(1001, "Server shutting down");
      } catch {}
    }
    try {
      websocket.close();
    } catch {}

    await prisma.$disconnect();
    console.info("Graceful shutdown complete");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown", err);
    process.exit(1);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
