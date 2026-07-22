// /src/modules/api-key/api-key.validation.ts

import { z } from "zod";

export const createApiKeySchema = z.object({
  name: z.string().min(3).max(100),
});
