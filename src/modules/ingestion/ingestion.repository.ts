// /src/modules/ingestion/ingestion.repository.ts

import { JsonObject } from "@prisma/client/runtime/client";
import { prisma } from "../../lib/prisma";

/**
 * Create log event record.
 */
export const createLogEvent = async (
  projectId: string,
  environment: string,
  level: string,
  event: string,
  occurredAt: Date,
  message?: string,
  payload?: JsonObject,
) => {
  return prisma.logEvent.create({
    data: {
      projectId,
      environment,
      level,
      event,
      occurredAt,
      message,
      payload,
    },
  });
};

/**
 * Count log events belonging to a project.
 */
export const countProjectLogs = async (projectId: string) => {
  return prisma.logEvent.count({
    where: {
      projectId,
    },
  });
};

/**
 * Find API key by key value.
 */
export const findApiKeyByKeyHash = async (keyHash: string) => {
  return prisma.apiKey.findUnique({
    where: {
      keyHash,
    },
    select: {
      id: true,
      projectId: true,
      revokedAt: true,
      lastUsedAt: true,
    },
  });
};

/**
 * Update API key last usage timestamp.
 */
export const updateApiKeyLastUsedAt = async (id: string) => {
  return prisma.apiKey.update({
    where: {
      id,
    },
    data: {
      lastUsedAt: new Date(),
    },
  });
};
