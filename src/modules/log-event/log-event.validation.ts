// /src/modules/log-event/log-event.validation.ts

import { z } from "zod";

export const logEventQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(250).default(50),
  level: z.string().trim().toLowerCase().max(30).optional(),
  environment: z.string().trim().max(50).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  search: z.string().trim().max(200).optional(),
});

export type LogEventQuery = z.infer<typeof logEventQuerySchema>;
