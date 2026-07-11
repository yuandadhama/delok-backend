// /src/modules/organization/organization.service.ts

import { AppError } from "../../utils/AppError";
import { createOrganization } from "./organization.repository";

export const createOrganizationService = async (
  name: string,
  userId: string,
) => {
  if (name.length < 3) {
    throw new AppError("name too short", 400);
  }

  return await createOrganization(name, userId);
};
