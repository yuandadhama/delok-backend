// /src/modules/organization/organization.controller.ts

import { Request, Response } from "express";
import { createOrganizationService } from "./organization.service";

export const createOrganizationController = async (
  req: Request,
  res: Response,
) => {
  const name = String(req.body.name);
  const userId = req.session.user.id;
  const data = await createOrganizationService(name, userId);
  res.json({
    success: true,
    data,
  });
};
