// /src/modules/log-event/log-event.controller.ts

import { Request, Response } from "express";
import { getLogsByProjectIdService } from "./log-event.service";
import { logEventQuerySchema } from "./log-event.validation";

/**
 * GET /api/projects/:projectId/logs
 *
 * Query:
 * - page
 * - limit
 *
 * Get paginated logs for a project.
 */
export const getLogsByProjectIdController = async (
  req: Request,
  res: Response,
) => {
  const userId = req.session.user.id;
  const projectId = String(req.params.projectId);

  const query = logEventQuerySchema.parse(req.query);

  const { page, limit } = query;

  const data = await getLogsByProjectIdService(projectId, userId, page, limit);
  res.json({
    success: true,
    data,
  });
};
