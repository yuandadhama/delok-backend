// /src/modules/api-key/api-key.service.ts

import { AppError } from "../../utils/AppError";
import { ensureProjectManagementAccess } from "../project/project.authorization";
import { findApiKeyById, revokeApiKey } from "./api-key.repository";

export const revokeApiKeyService = async (id: string, userId: string) => {
  const apiKey = await findApiKeyById(id);

  if (!apiKey) {
    throw new AppError("ApiKey not found", 404);
  }

  if (apiKey.revokedAt) {
    throw new AppError("ApiKey already revoked", 400);
  }

  await ensureProjectManagementAccess(apiKey.projectId, userId);

  await revokeApiKey(id);

  return {
    message: "Api Key revoked successfully",
    id: apiKey.id,
    revokedAt: new Date(),
  };
};
