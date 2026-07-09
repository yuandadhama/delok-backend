import express, { Request, Response } from "express";

export const organizationRoute = express.Router();

organizationRoute.get("/", (req: Request, res: Response) => {
  res.send("hello world");
});
