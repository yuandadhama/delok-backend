// /src/infrastructure/realtime/event.types.ts

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

/**
 * Maps every realtime event to the payload
 * that will be delivered to connected clients.
 */
export interface RealtimeEventMap {
  "log.created": LogCreatedEvent;

  "project.subscribe": {
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
