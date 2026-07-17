// /src/modules/project/project.controller.ts

import { Request, Response } from "express";
import {
  createProjectService,
  deleteProjectService,
  getAllProjectsService,
  getProjectByIdService,
} from "./project.service";

/**
 * POST /api/project
 *
 * Create a new project inside organization.
 */
export const createProjectController = async (req: Request, res: Response) => {
  const userId = req.session.user.id;
  const { name, organizationId } = req.body;

  const data = await createProjectService(name, userId, organizationId);
  res.json({
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
 * GET /api/project/:projectId
 *
 * Get project details and API keys.
 */
export const getProjectByIdController = async (req: Request, res: Response) => {
  const projectId = String(req.params.projectId);
  const userId = req.session.user.id;

  const data = await getProjectByIdService(projectId, userId);
  res.json({
    success: true,
    data,
  });
};

/**
 * DELETE /api/project/:projectId
 *
 * DELETE project by id
 */
export const deleteProjectController = async (req: Request, res: Response) => {
  const projectId = String(req.params.projectId);
  const userId = req.session.user.id;

  const data = await deleteProjectService(projectId, userId);
  res.json({
    success: true,
    data,
  });
};
