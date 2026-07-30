// /src/infrastructure/realtime/event.types.ts

/**
 * Maps every realtime event to the payload
 * that will be delivered to connected clients.
 */
export interface RealtimeEventMap {
  "log.created": unknown;
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
