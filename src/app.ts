// app.ts
import express from "express";
import cors from "cors";

import { userRoute } from "./modules/user/user.route";
import { errorMiddleWare } from "./middlewares/error.middleware";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

export const app = express();

//configure cors middleware
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
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

app.use("/api/user", userRoute);

app.get("/", (req, res) => {
  res.send("hello ");
});

app.get("/health", (req, res) => {
  res.send(`hello, this is response from ${req.url}`);
});

app.use(errorMiddleWare);
