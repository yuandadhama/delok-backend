import { RequestHandler } from "express";

export const asyncHandler = (controller: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(controller(req, res, next)).catch(next);
  };
};
