// /src/modules/ingestion/ingestion.validation.ts

import { z } from "zod";

export const createLogEventSchema = z
  .object({
    environment: z.string().trim().min(1).max(50),
    level: z.string().trim().min(1).max(30),
    event: z.string().trim().min(1).max(200),
    message: z.string().max(5000).optional(),
    occurredAt: z.coerce.date().refine((d) => {
      const now = Date.now();
      const t = d.getTime();
      // Allow up to 5 min in future (clock skew) and 30 days in past
      return t <= now + 5 * 60 * 1000 && t >= now - 30 * 24 * 60 * 60 * 1000;
    }, "occurredAt out of allowed range"),
    payload: z.unknown().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.payload !== undefined) {
      try {
        const size = JSON.stringify(data.payload).length;
        if (size > 10 * 1024) {
          ctx.addIssue({
            code: "custom",
            message: "payload too large (max 10kb)",
            path: ["payload"],
          });
        }
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "payload must be JSON serializable",
          path: ["payload"],
        });
      }
    }
  });

export type LogEvent = z.infer<typeof createLogEventSchema>;
