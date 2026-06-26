import express from "express";
import { getUserByIdController } from "../controllers/user.controller";
export const userRoute = express.Router();

userRoute.use((req, res, next) => {
  console.info(`[${req.method}] ${req.originalUrl}`);
  console.info("route specifik");
  next();
});

userRoute.get("/:id", (req, res) => {
  const response = getUserByIdController(req);
  res.send(response);
});

userRoute.get("/", (req, res) => {
  const { name } = req.query;
  res.send(`this is user yoou search name: ${name}`);
});

userRoute.post("/", (req, res) => {
  const { name, age } = req.body;
  res.send(`here is your new user: ${name} age of ${age}`);
});
