// app.ts
import express from "express";

import { userRoute } from "./modules/user/user.route";
import { errorMiddleWare } from "./middlewares/error.middleware";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

export const app = express();

// auth route better auth setting
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use("/api/user", userRoute);

app.get("/", (req, res) => {
  res.send("hello ");
});

app.get("/health", (req, res) => {
  res.send(`hello, this is response from ${req.url}`);
});

app.use(errorMiddleWare);
