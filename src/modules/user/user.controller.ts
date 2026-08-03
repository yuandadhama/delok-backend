// /src/modules/user/user.controller.ts

import { Request, Response } from "express";

/**
 * GET /api/user/me
 * Get current user session
 */
export const meController = async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: req.session,
  });
};
