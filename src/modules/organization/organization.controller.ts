// /src/modules/organization/organization.controller.ts

import { Request, Response } from "express";

import {
  createOrganizationService,
  getAllOrganizationService,
  getOrganizationByIdService,
} from "./organization.service";

/**
 * POST /api/organization
 * Create new organization.
 */
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

/**
 * GET /api/organization
 * Get all organizations owned by current user.
 */
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

/**
 * GET /api/organization/:id
 * Get single organization by id.
 */
export const getOrganizationByIdController = async (
  req: Request,
  res: Response,
) => {
  const id = String(req.params.id);
  const userId = req.session.user.id;

  const data = await getOrganizationByIdService(id, userId);

  res.json({
    success: true,
    data,
  });
};
