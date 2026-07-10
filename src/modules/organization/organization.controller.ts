import { Request, Response } from "express";
import { createOrganizationService } from "./organization.service";

export const createOrganizationController = async (
  req: Request,
  res: Response,
) => {
  const name = String(req.body.name);
  const data = await createOrganizationService(name);
  res.json({
    success: true,
    data,
  });
};
