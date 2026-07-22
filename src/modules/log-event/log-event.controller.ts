// /src/modules/log-event/log-event.controller.ts

import { Request, Response } from "express";
import { getLogsByProjectIdService } from "./log-event.service";
import { logEventQuerySchema } from "./log-event.validation";

/**
 * GET /api/projects/:projectId/logs
 *
 * Get paginated logs for a project.
 *
 * Query:
 * - page
 * - limit
 * - level
 * - environment
 * - search
 * - from
 * - to
 *
 * User must be a member of the project organization.
 */
export const getLogsByProjectIdController = async (
  req: Request,
  res: Response,
) => {
  const userId = req.session.user.id;
  const projectId = String(req.params.projectId);

  const query = logEventQuerySchema.parse(req.query);

  const data = await getLogsByProjectIdService(projectId, userId, query);

  res.status(201).json({
    success: true,
    data,
  });
};
