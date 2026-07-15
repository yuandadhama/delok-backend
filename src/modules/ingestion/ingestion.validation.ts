// /src/modules/ingestion/ingestion.validation.ts

import { z } from "zod";

export const createLogEventSchema = z.object({
  environment: z.string().min(1, "environment cannot be empty"),
  level: z.string().min(1, "level cannot be empty"),
  event: z.string().min(1, "event cannot be empty"),
  message: z.string().optional(),
  occurredAt: z.coerce.date(),
  payload: z.unknown().optional(),
});

export type LogEvent = z.infer<typeof createLogEventSchema>;
