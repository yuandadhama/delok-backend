import { z } from "zod";

export const createLogEventSchema = z.object({
  environment: z.string(),
  level: z.string(),
  event: z.string(),
  message: z.string().optional(),
  occurredAt: z.coerce.date(),
  payload: z.record(z.string(), z.string()).optional(),
});

export type LogEvent = z.infer<typeof createLogEventSchema>;
