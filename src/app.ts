import express from "express";

import { userRoute } from "./routes/user.route";
import { errorMiddleWare } from "./middlewares/error.middleware";

export const app = express();

app.use(express.json());

app.use("/user", userRoute);

app.get("/", (req, res) => {
  res.send("hello ");
});

app.get("/health", (req, res) => {
  res.send(`hello, this is response from ${req.url}`);
});

app.use(errorMiddleWare);
