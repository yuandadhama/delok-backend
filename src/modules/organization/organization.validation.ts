import { z } from "zod";

export const organizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3)
    .max(100)
    .regex(
      /^(?!-)(?!.*--)(?!.*-$)[A-Za-z0-9]+(?:[ -][A-Za-z0-9]+)*$/,
      "Only alphanumeric characters, spaces, and single hyphens are allowed, and the name cannot start or end with a hyphen",
    ),
});
