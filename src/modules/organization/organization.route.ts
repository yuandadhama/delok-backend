import express, { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { createOrganizationController } from "./organization.controller";

export const organizationRoute = express.Router();

organizationRoute.get("/", (req: Request, res: Response) => {
  res.send("hello world");
});

organizationRoute.post("/create", asyncHandler(createOrganizationController));
