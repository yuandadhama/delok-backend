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
 * POST /api/organizations/:organizationSlug/projects
 *
 * Create a new project inside organization.
 */
export const createProjectController = async (req: Request, res: Response) => {
  const userId = req.session.user.id;
  const { name } = req.body;
  const organizationSlug = String(req.params.organizationSlug);

  const data = await createProjectService(name, userId, organizationSlug);
  res.status(201).json({
    success: true,
    data,
  });
};

/**
 * GET /api/organizations/:organizationSlug/projects
 *
 * Get all projects inside organization.
 */
export const getAllProjectsController = async (req: Request, res: Response) => {
  const organizationSlug = String(req.params.organizationSlug);
  const userId = req.session.user.id;

  const data = await getAllProjectsService(organizationSlug, userId);
  res.json({
    success: true,
    data,
  });
};

/**
 * GET /api/organizations/:organizationSlug/projects/:projectId
 *
 * Get project details and API keys.
 */
export const getProjectByIdController = async (req: Request, res: Response) => {
  const organizationSlug = String(req.params.organizationSlug);
  const projectId = String(req.params.projectId);
  const userId = req.session.user.id;

  const data = await getProjectByIdService(organizationSlug, projectId, userId);
  res.json({
    success: true,
    data,
  });
};

/**
 * PATCH /api/organizations/:organizationSlug/projects/:projectId
 *
 * Update project by id
 */
export const updateProjectController = async (req: Request, res: Response) => {
  const organizationSlug = String(req.params.organizationSlug);
  const projectId = String(req.params.projectId);
  const userId = req.session.user.id;
  const name = req.body.name;

  const data = await updateProjectService(
    organizationSlug,
    projectId,
    userId,
    name,
  );
  res.json({
    success: true,
    data,
  });
};

/**
 * DELETE /api/organizations/:organizationSlug/projects/:projectId
 *
 * delete project by id
 */
export const deleteProjectController = async (req: Request, res: Response) => {
  const organizationSlug = String(req.params.organizationSlug);
  const projectId = String(req.params.projectId);
  const userId = req.session.user.id;

  const data = await deleteProjectService(organizationSlug, projectId, userId);
  res.json({
    success: true,
    data,
  });
};
