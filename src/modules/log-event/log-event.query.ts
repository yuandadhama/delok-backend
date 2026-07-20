import { Prisma } from "../../generated/prisma/client";
import { LogFilter } from "./log-event.type";

export const buildLogFilter = (
  filter: LogFilter,
): Prisma.LogEventWhereInput => {
  const { level, environment, search } = filter;

  return {
    ...(level && {
      level,
    }),

    ...(environment && {
      environment,
    }),

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
