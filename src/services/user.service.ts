export const getUserByIdService = (id: string) => {
  return {
    id,
    name: `name ${id}`,
    email: `email${id}@.com`,
  };
};
