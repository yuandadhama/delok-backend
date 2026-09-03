// src/infrastructure/realtime/realtime.service.ts

import { WebSocket } from "ws";

import { RealtimeEvent } from "./event.types.js";
import { subscriptions } from "./websocket.js";

/**
 * Broadcasts realtime events to subscribed clients.
 */
export class RealtimeService {
  emit(event: RealtimeEvent) {
    const payload = JSON.stringify(event);

    for (const [client, projectIds] of subscriptions) {
      if (client.readyState !== WebSocket.OPEN) {
        continue;
      }

      if (
        event.type === "log.created" &&
        !projectIds.has(event.data.projectId)
      ) {
        continue;
      }

      if (
        event.type === "project.log_count.updated" &&
        !projectIds.has(event.data.projectId)
      ) {
        continue;
      }

      try {
        client.send(payload);
      } catch {
        // ignore send failures for individual clients
      }
    }
  }
}

export const realtime = new RealtimeService();
