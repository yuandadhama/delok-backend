import express from "express";
import {
  createUserController,
  deleteUserController,
  getAllUserController,
  getUserByIdController,
  searchUserByNameController,
} from "../controllers/user.controller";
import { asyncHandler } from "../utils/async-handler";

export const userRoute = express.Router();

userRoute.use((req, res, next) => {
  console.info(`[${req.method}] ${req.originalUrl}`);
  next();
});

// async handler to handle try/catch in every route controller

// user/search?name=<name>
userRoute.get("/search", asyncHandler(searchUserByNameController));

// /user/:id
userRoute.get("/:id", asyncHandler(getUserByIdController));
userRoute.delete("/:id", asyncHandler(deleteUserController));

// /user
userRoute.get("/", asyncHandler(getAllUserController));
userRoute.post("/", asyncHandler(createUserController));
