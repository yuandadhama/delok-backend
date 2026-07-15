// /src/modules/log-event/log-event.controller.ts

import { Request, Response } from "express";
import { getLogsByProjectIdService } from "./log-event.service";

/**
 * GET /api/logs/project/:projectId
 *
 * Get all logs for a project.
 */
export const getLogsByProjectIdController = async (
  req: Request,
  res: Response,
) => {
  const userId = req.session.user.id;
  const projectId = String(req.params.projectId);

  const data = await getLogsByProjectIdService(projectId, userId);
  res.json({
    success: true,
    data,
  });
};
