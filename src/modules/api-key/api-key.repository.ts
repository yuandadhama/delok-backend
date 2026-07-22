// /src/modules/api-key/api-key.repository.ts

import { prisma } from "../../lib/prisma";

/**
 * Create a new API key record.
 *
 * Stores hashed API key metadata only.
 * Plaintext key must never be persisted.
 */
export const createApiKey = async (data: {
  name: string;
  keyHash: string;
  keyPrefix: string;
  projectId: string;
  createdById: string;
}) => {
  return prisma.apiKey.create({
    data,
  });
};

/**
 * Find API key by id.
 */
export const findApiKeyById = async (id: string) => {
  return prisma.apiKey.findUnique({
    where: {
      id,
    },
  });
};

/**
 * Find all API keys belonging to a project.
 *
 * Returns metadata only.
 * Never returns secret key material.
 */
export const findApiKeysByProjectId = async (projectId: string) => {
  return prisma.apiKey.findMany({
    where: {
      projectId,
    },
    select: {
      id: true,
      name: true,
      lastUsedAt: true,
      createdAt: true,
      revokedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * Revoke API key.
 *
 * Soft delete by setting revokedAt timestamp.
 */
export const revokeApiKey = async (id: string) => {
  return prisma.apiKey.update({
    where: {
      id,
    },
    data: {
      revokedAt: new Date(),
    },
  });
};
