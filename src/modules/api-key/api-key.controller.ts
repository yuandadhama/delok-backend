// /src/modules/api-key/api-key.controller.ts

import { Request, Response } from "express";
import {
  createApiKeyService,
  getApiKeysByProjectIdService,
  revokeApiKeyService,
  updateApiKeyNameService,
} from "./api-key.service";
import id from "zod/v4/locales/id.cjs";

export const createApiKeyController = async (req: Request, res: Response) => {
  const projectId = String(req.params.projectId);
  const userId = req.session.user.id;
  const name = String(req.body.name);

  const data = await createApiKeyService(projectId, userId, name);
  res.status(201).json({
    success: true,
    data,
  });
};

/**
 * GET /api/projects/:projectId/api-keys
 *
 * Get all API keys for a project.
 */
export const getApiKeysByProjectIdController = async (
  req: Request,
  res: Response,
) => {
  const projectId = String(req.params.projectId);

  const userId = req.session.user.id;

  const data = await getApiKeysByProjectIdService(projectId, userId);

  res.json({
    success: true,
    data,
  });
};

export const updateApiKeyNameController = async (
  req: Request,
  res: Response,
) => {
  const id = String(req.params.id);
  const name = String(req.body.name);
  const userId = req.session.user.id;

  const data = await updateApiKeyNameService(id, name, userId);

  res.json({
    success: true,
    data,
  });
};

/**
 * PATCH /api/api-key/:id/revoke
 *
 * Revoke an API key.
 */
export const revokeApiKeyController = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const userId = req.session.user.id;

  const data = await revokeApiKeyService(id, userId);
  res.json({
    success: true,
    data,
  });
};
