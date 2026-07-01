import { z } from "zod";

// export const signUpValidation
export const signUpValidation = z.object({
  email: z.email("invalid email format"),
  password: z.string().min(6, "password must be at least 6 characters"),
});
