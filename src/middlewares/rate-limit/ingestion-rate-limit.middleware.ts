import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { errorResponse } from "../../utils/api-response";

// Per API key + IP sliding window
// Trust proxy is set so req.ip respects X-Forwarded-For

export const ingestionRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120, // 120 req/min per key/ip
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const apiKey = (req.get("x-api-key") || "").slice(0, 20);
    if (apiKey) return `key:${apiKey}`;
    return ipKeyGenerator(req.ip as string);
  },
  handler(_req, res) {
    return errorResponse(res, 429, "RATE_LIMIT_EXCEEDED", "Too many ingestion requests");
  },
});
