// /src/infrastructure/realtime/realtime.service.ts

import { WebSocket } from "ws";
import { websocket } from "./websocket";
import { RealtimeEvent } from "./event.types";

/**
 * Broadcasts realtime events to all connected clients.
 */
export class RealtimeService {
  emit(event: RealtimeEvent) {
    const payload = JSON.stringify(event);

    for (const client of websocket.clients) {
      if (client.readyState !== WebSocket.OPEN) {
        continue;
      }

      client.send(payload);
    }
  }
}

export const realtime = new RealtimeService();
