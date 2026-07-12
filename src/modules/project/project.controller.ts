import { Request, Response } from "express";
import { createProjectService, getAllProjectsService } from "./project.service";

/**
 * POST /api/project
 * Create a new project.
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
 * Get all projects in an organization.
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
