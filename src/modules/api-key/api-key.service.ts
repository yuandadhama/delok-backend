// /src/modules/api-key/api-key.service.ts

import { randomBytes } from "crypto";
import { AppError } from "../../utils/AppError";
import { ensureProjectManagementAccess } from "../project/project.authorization";
import {
  createApiKey,
  findApiKeyById,
  findApiKeysByProjectId,
  revokeApiKey,
  updateApiKeyName,
} from "./api-key.repository";
import { sha256 } from "../../utils/hash";

/**
 * Create a new API key for a project.
 *
 * Authorization:
 * User must have project management access.
 *
 * Security:
 * - Generates cryptographically secure random key.
 * - Stores hash only.
 * - Returns plaintext key exactly once.
 */
export const createApiKeyService = async (
  projectId: string,
  userId: string,
  name: string,
) => {
  const project = await ensureProjectManagementAccess(projectId, userId);

  const rawKey = `dlok_${randomBytes(32).toString("hex")}`;

  const keyPrefix = rawKey.slice(0, 12);
  const keyHash = sha256(rawKey);

  await createApiKey({
    createdById: userId,
    keyHash,
    keyPrefix,
    name,
    projectId,
  });

  console.info(
    JSON.stringify({
      event: "api-key.created",
      projectId,
      organizationId: project.organization.id,
    }),
  );

  return {
    key: rawKey,
  };
};

/**
 * Get all API keys belonging to a project.
 *
 * Authorization:
 * User must have project management access.
 *
 * Returns metadata only.
 */
export const getApiKeysByProjectIdService = async (
  projectId: string,
  userId: string,
) => {
  await ensureProjectManagementAccess(projectId, userId);

  return findApiKeysByProjectId(projectId);
};

export const updateApiKeyNameService = async (
  id: string,
  name: string,
  userId: string,
) => {
  const apiKey = await findApiKeyById(id);

  if (!apiKey) {
    throw new AppError("ApiKey not found", 404);
  }

  if (apiKey.revokedAt) {
    throw new AppError("API key already revoked cannot update name", 400);
  }

  await ensureProjectManagementAccess(apiKey.projectId, userId);

  const updatedApiKey = await updateApiKeyName(id, name);

  return {
    message: "API Key name updated",
    id: updatedApiKey.id,
    name: updatedApiKey.name,
  };
};

/**
 * Revoke API key.
 *
 * Authorization:
 * User must have project management access.
 *
 * Revocation is permanent.
 * Revoked keys can no longer authenticate ingestion requests.
 */
export const revokeApiKeyService = async (id: string, userId: string) => {
  const apiKey = await findApiKeyById(id);

  if (!apiKey) {
    throw new AppError("ApiKey not found", 404);
  }

  if (apiKey.revokedAt) {
    throw new AppError("API key already revoked", 400);
  }

  await ensureProjectManagementAccess(apiKey.projectId, userId);

  const revokedApiKey = await revokeApiKey(id);

  return {
    message: "Api Key revoked successfully",
    id: apiKey.id,
    revokedAt: revokedApiKey.revokedAt,
  };
};
