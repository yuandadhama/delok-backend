// /src/app.ts

import express from "express";
import cors from "cors";

import { userRoute } from "./modules/user/user.route";
import { errorMiddleWare } from "./middlewares/error.middleware";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { organizationRoute } from "./modules/organization/organization.route";
import { projectRoute } from "./modules/project/routes/project.route";
import { ingestionRoute } from "./modules/ingestion/ingestion.route";
import { logEventRoute } from "./modules/log-event/log-event.route";
import { organizationProjectRoute } from "./modules/project/routes/organization-project.route";

export const app = express();

//configure cors middleware
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    credentials: true,
  }),
);

app.use(express.json());

/**
 * Route level logger
 */
app.use((req, res, next) => {
  console.info(`[${req.method}] ${req.originalUrl}`);
  console.log(`req.body: ${JSON.stringify(req.body)}`);
  next();
});

// auth route better auth setting
app.all("/api/auth/*splat", toNodeHandler(auth));

// route for all modules
app.use("/api/user", userRoute);

app.use("/api/organization", organizationRoute);

// route for projects related resource
app.use(
  "/api/organizations/:organizationId/projects",
  organizationProjectRoute,
);
app.use("/api/project", projectRoute);

// route for ingestion API
app.use("/api/ingestion", ingestionRoute);

app.use("/api/projects/:projectId/logs", logEventRoute);

// route to test if server run already
app.get("/", (req, res) => {
  res.send("hello");
});

app.use(errorMiddleWare);
