import { Prisma } from "../../generated/prisma/client.js";
import { LogFilter } from "./log-event.type.js";

export const buildLogFilter = (
  filter: LogFilter,
): Prisma.LogEventWhereInput => {
  const { level, environment, search, from, to } = filter;

  const nextDay = to ? new Date(to) : undefined;

  if (nextDay) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  return {
    ...(level && {
      level,
    }),

    ...(environment && {
      environment,
    }),

    ...(from || to
      ? {
          occurredAt: {
            ...(from && { gte: from }),
            ...(to && { lt: nextDay }),
          },
        }
      : {}),

    ...(search && {
      OR: [
        {
          event: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          message: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    }),
  };
};
