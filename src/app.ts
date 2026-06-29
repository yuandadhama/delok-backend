import express from "express";

import { userRoute } from "./modules/user.route";
import { errorMiddleWare } from "./middlewares/error.middleware";

export const app = express();

app.use(express.json());

app.use("/api/user", userRoute);

app.get("/", (req, res) => {
  res.send("hello ");
});

app.get("/health", (req, res) => {
  res.send(`hello, this is response from ${req.url}`);
});

app.use(errorMiddleWare);
