// src/middlewares/rate-limit/auth-rate-limit.middleware.ts

import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    message: "Too many login attempts",
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: {
    message: "Too many registration attempts",
  },
});

const logoutLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 30,
  message: {
    message: "Too many logout attempts",
  },
});

const verificationEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: {
    message: "Too many email verification request requests, try again later",
  },
});
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  message: {
    message: "Too many password reset requests, try again later",
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

  next();
};
