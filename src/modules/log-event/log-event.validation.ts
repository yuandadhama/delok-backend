// /src/modules/log-event/log-event.validation.ts

import { z } from "zod";

export const logEventQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  level: z.string().trim().toLowerCase().optional(),
  environment: z.string().trim().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  search: z.string().trim().optional(),
});

export type LogEventQuery = z.infer<typeof logEventQuerySchema>;
