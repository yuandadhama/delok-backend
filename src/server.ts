// /src/server.ts

import "dotenv/config";
import { createServer } from "node:http";

import { app } from "./app";
import { websocket } from "./infrastructure/realtime/websocket";

const port = process.env.PORT;

const server = createServer(app);

server.on("upgrade", (request, socket, head) => {
  websocket.handleUpgrade(request, socket, head, (client) => {
    websocket.emit("connetion", client, request);
  });
});

server.listen(port, () => {
  console.info(`Server listen at http://localhost:${port}`);
});
