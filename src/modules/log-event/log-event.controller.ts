import { Request, Response } from "express";
import { getLogsByProjectIdService } from "./log-event.service";

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
