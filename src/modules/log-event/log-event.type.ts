// /src/modules/log-event/log-event.type.ts

export type LogQueryOptions = {
  pagination: Pagination;
  filter: LogFilter;
};

export type LogFilter = {
  level?: string;
  environment?: string;
  search?: string;
  from?: Date;
  to?: Date;
};

export type Pagination = {
  skip: number;
  limit: number;
};
