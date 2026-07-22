// /src/modules/project/project.controller.ts

import { Request, Response } from "express";
import {
  createProjectService,
  deleteProjectService,
  getAllProjectsService,
  getProjectByIdService,
  updateProjectService,
} from "./project.service";

/**
 * POST /api/project
 *
 * Create a new project inside organization.
 */
export const createProjectController = async (req: Request, res: Response) => {
  const userId = req.session.user.id;
  const { name } = req.body;
  const organizationId = String(req.params.organizationId);

  console.info(
    `(controller) userId: ${userId} | name: ${name} | organizationId: ${organizationId}`,
  );
  const data = await createProjectService(name, userId, organizationId);
  res.status(201).json({
    success: true,
    data,
  });
};

/**
 * GET /api/project/organization/:organizationId
 *
 * Get all projects inside organization.
 */
export const getAllProjectsController = async (req: Request, res: Response) => {
  const organizationId = String(req.params.organizationId);
  const userId = req.session.user.id;

  const data = await getAllProjectsService(organizationId, userId);
  res.json({
    success: true,
    data,
  });
};

/**
 * GET /api/project/:id
 *
 * Get project details and API keys.
 */
export const getProjectByIdController = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const userId = req.session.user.id;

  const data = await getProjectByIdService(id, userId);
  res.json({
    success: true,
    data,
  });
};

/**
 * PATCH /api/project/:id
 *
 * Update project by id
 */
export const updateProjectController = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const userId = req.session.user.id;
  const name = req.body.name;

  const data = await updateProjectService(id, userId, name);
  res.json({
    success: true,
    data,
  });
};

/**
 * DELETE /api/project/:id
 *
 * delete project by id
 */
export const deleteProjectController = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const userId = req.session.user.id;

  const data = await deleteProjectService(id, userId);
  res.json({
    success: true,
    data,
  });
};
