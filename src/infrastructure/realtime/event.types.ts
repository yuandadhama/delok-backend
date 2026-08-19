// src/infrastructure/realtime/event.types.ts

export interface LogCreatedEvent {
  id: string;
  projectId: string;
  environment: string;
  level: string;
  event: string;
  message: string | null;
  occurredAt: Date;
  receivedAt: Date;
  payload: Record<string, unknown> | null;
}

export interface ProjectLogCountUpdatedEvent {
  projectId: string;
  logCount: number;
}

/**
 * Maps every realtime event to the payload
 * that will be delivered to connected clients.
 */
export interface RealtimeEventMap {
  "log.created": LogCreatedEvent;

  "project.log_count.updated": ProjectLogCountUpdatedEvent;

  "project.subscribe": {
    projectId: string;
  };

  "project.unsubscribe": {
    projectId: string;
  };
}

/**
 * Every realtime event name supported by the backend.
 */
export type RealtimeEventType = keyof RealtimeEventMap;

/**
 * Generic realtime event.
 */
export interface RealtimeEvent<
  TType extends RealtimeEventType = RealtimeEventType,
> {
  type: TType;
  data: RealtimeEventMap[TType];
}
