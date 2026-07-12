import { Request, Response } from "express";
import { createProjectService, getAllProjectsService } from "./project.service";

export const createProjectController = async (req: Request, res: Response) => {
  const userId = req.session.user.id;
  const { name, organizationId } = req.body;

  const data = await createProjectService(name, userId, organizationId);
  res.json({
    success: "true",
    data,
  });
};

export const getAllProjectsController = async (req: Request, res: Response) => {
  const userId = req.session.user.id;
  const organizationId = String(req.params.organizationId);

  const data = await getAllProjectsService(userId, organizationId);
  res.json({
    success: "true",
    data,
  });
};
