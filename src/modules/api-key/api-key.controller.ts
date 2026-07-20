// /src/modules/api-key/api-key.controller.ts

import { Request, Response } from "express";
import { revokeApiKeyService } from "./api-key.service";

export const revokeApiKeyController = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const userId = req.session.user.id;

  const data = await revokeApiKeyService(id, userId);
  res.json({
    success: true,
    data,
  });
};
