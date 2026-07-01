import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.AUTH_BASE_URL || "http://localhost:3000",
});
