// /src/modules/organization/organization.controller.ts

import { Request, Response } from "express";

import {
  createOrganizationService,
  deleteOrganizationService,
  getAllOrganizationService,
  getOrganizationBySlugService,
  updateOrganizationService,
} from "./organization.service";

/**
 * POST /api/organization
 * Create new organization.
 */
export const createOrganizationController = async (
  req: Request,
  res: Response,
) => {
  const name = req.body.name;
  const userId = req.session.user.id;

  const data = await createOrganizationService(name, userId);

  res.status(201).json({
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
 * GET /api/organization/:slug
 * Get single organization by slug.
 */
export const getOrganizationBySlugController = async (
  req: Request,
  res: Response,
) => {
  const slug = String(req.params.slug);
  const userId = req.session.user.id;

  const data = await getOrganizationBySlugService(slug, userId);

  res.json({
    success: true,
    data,
  });
};

/**
 * PATCH /api/organization/:slug
 * update organization by slug.
 */
export const updateOrganizationController = async (
  req: Request,
  res: Response,
) => {
  const slug = String(req.params.slug);
  const userId = req.session.user.id;
  const name = req.body.name;

  const data = await updateOrganizationService(slug, name, userId);

  res.json({
    success: true,
    data,
  });
};

/**
 * DELETE /api/organization/:slug
 * delete organization by slug.
 */
export const deleteOrganizationController = async (
  req: Request,
  res: Response,
) => {
  const slug = String(req.params.slug);
  const userId = req.session.user.id;

  const data = await deleteOrganizationService(slug, userId);

  res.json({
    success: true,
    data,
  });
};
