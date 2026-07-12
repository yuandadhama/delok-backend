// /src/modules/organization/organization.controller.ts

import { Request, Response } from "express";
import {
  createOrganizationService,
  getAllOrganizationService,
  getOrganizationByIdService,
} from "./organization.service";

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

export const getAllOrganizationController = async (
  req: Request,
  res: Response,
) => {
  const userId = req.session.user.id;
  const data = await getAllOrganizationService(userId);
  res.json({
    success: true,
    data,
  });
};

export const getOrganizationByIdController = async (
  req: Request,
  res: Response,
) => {
  const id = String(req.params.id);
  const data = await getOrganizationByIdService(id);
  res.json({
    success: true,
    data,
  });
};
