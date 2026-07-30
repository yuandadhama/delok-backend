// /src/infrastructure/realtime/realtime.service.ts

import { WebSocket } from "ws";
import { RealtimeEvent } from "./event.types";
import { subscriptions } from "./websocket";

/**
 * Broadcasts realtime events to subscribed clients.
 */
export class RealtimeService {
  emit(event: RealtimeEvent) {
    const payload = JSON.stringify(event);

    for (const [client, projectId] of subscriptions) {
      if (client.readyState !== WebSocket.OPEN) {
        continue;
      }

      if (event.type === "log.created" && projectId !== event.data.projectId) {
        continue;
      }

      client.send(payload);
    }
  }
}

export const realtime = new RealtimeService();
