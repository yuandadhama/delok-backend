import { createOrganization } from "./organization.repository";

export const createOrganizationService = async (name: string) => {
  await createOrganization(name);
};
