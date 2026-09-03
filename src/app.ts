// /src/app.ts

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { randomUUID } from "node:crypto";

import { env } from "./lib/env.js";
import { prisma } from "./lib/prisma.js";
import { userRoute } from "./modules/user/user.route.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { organizationRoute } from "./modules/organization/organization.route.js";
import { ingestionRoute } from "./modules/ingestion/ingestion.route.js";
import { projectLogEventRoute } from "./modules/log-event/routes/project-log-event.route.js";
import { organizationProjectRoute } from "./modules/project/routes/organization-project.route.js";
import { apiKeyRoute } from "./modules/api-key/routes/api-key.route.js";
import { projectApiKeyRoute } from "./modules/api-key/routes/project-api-key.route.js";
import { authRateLimiter } from "./middlewares/rate-limit/auth-rate-limit.middleware.js";
import { authRoute } from "./modules/auth/auth.route.js";

export const app = express();

// Trust proxy: required for correct req.ip behind reverse proxy (rate limiting, logging)
// Single proxy (Caddy/Nginx/Cloud) — change to number if multi-hop
app.set("trust proxy", 1);

app.use(helmet());

// Request ID + lightweight structured logging (no bodies)
app.use((req, res, next) => {
  const id = randomUUID();
  (req as any).id = id;
  res.setHeader("x-request-id", id);
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.info(
      JSON.stringify({
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        duration,
        requestId: id,
      }),
    );
  });
  next();
});

// CORS — explicit origin from env, never * with credentials
app.use(
  cors({
    origin: env.FRONTEND_URL,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    credentials: true,
  }),
);

// auth route better auth setting
app.use("/api/auth", authRateLimiter);
app.use("/api/auth", authRoute);
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json({ limit: "1mb" }));
// route for all modules
app.use("/api/user", userRoute);

app.use("/api/organization", organizationRoute);

// route for projects related resource
app.use(
  "/api/organizations/:organizationSlug/projects",
  organizationProjectRoute,
);

// route for ingestion API
app.use("/api/ingestion", ingestionRoute);

// route for log events related resource
app.use("/api/projects/:projectId/logs", projectLogEventRoute);

// route for api keys related resource
app.use("/api/projects/:projectId/api-keys", projectApiKeyRoute);
app.use("/api/api-key", apiKeyRoute);

// Operational endpoints
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/readiness", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "unavailable", reason: "db_unavailable" });
  }
});

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "delok-backend" });
});

app.use(errorMiddleware);
