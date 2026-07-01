import { auth } from "../../lib/auth";

export const signUpService = async (email: string, password: string) => {
  console.log("signUpService", email, password);
  auth.api.signInEmail({
    body: {
      email,
      password,
    },
    asResponse: true,
  });
};
