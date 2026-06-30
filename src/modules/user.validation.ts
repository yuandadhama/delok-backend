import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string()
    .min(3, "name must be at least 3 characters")
    .max(100, "name too long"),

  email: z.email("invalid email format"),
});

export const updateUserSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.email(),
});

export type UserType = z.infer<typeof createUserSchema>;
