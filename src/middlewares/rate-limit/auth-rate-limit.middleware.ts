// src/middlewares/rate-limit/auth-rate-limit.middleware.ts

import rateLimit from "express-rate-limit";
import { errorResponse } from "../../utils/api-response.js";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  handler(req, res) {
    return errorResponse(
      res,
      429,
      "RATE_LIMIT_EXCEEDED",
      "Too many sign-in requests",
    );
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  handler(req, res) {
    return errorResponse(
      res,
      429,
      "RATE_LIMIT_EXCEEDED",
      "Too many sign-up requests",
    );
  },
});

const logoutLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 30,
  handler(req, res) {
    return errorResponse(
      res,
      429,
      "RATE_LIMIT_EXCEEDED",
      "Too many sign-out requests",
    );
  },
});

const verificationEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,

  handler(req, res) {
    return errorResponse(
      res,
      429,
      "RATE_LIMIT_EXCEEDED",
      "Too many email verification requests",
    );
  },
});
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  handler(req, res) {
    return errorResponse(
      res,
      429,
      "RATE_LIMIT_EXCEEDED",
      "Too many reset password email requests",
    );
  },
});

export const authRateLimiter = (req: any, res: any, next: any) => {
  const path = req.path;

  if (path === "/sign-in/email") {
    return loginLimiter(req, res, next);
  }

  if (path === "/sign-up/email") {
    return registerLimiter(req, res, next);
  }

  if (path === "/sign-out") {
    return logoutLimiter(req, res, next);
  }

  if (path === "/request-password-reset") {
    return resetPasswordLimiter(req, res, next);
  }

  if (path === "/resend-verification") {
    return verificationEmailLimiter(req, res, next);
  }

  next();
};
