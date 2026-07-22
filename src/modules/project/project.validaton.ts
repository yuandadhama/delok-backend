// /src/modules/project/project.validation.ts

import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().trim().min(3).max(100),
});
