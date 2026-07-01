import express from "express";
import { asyncHandler } from "../../utils/async-handler";
import { signUpController } from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import { signUpValidation } from "./auth.validation";

export const authRoute = express.Router();

authRoute.post(
  "/signup",
  validate(signUpValidation),
  asyncHandler(signUpController),
);
