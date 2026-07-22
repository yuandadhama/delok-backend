// /src/utils/hash.ts

import { createHash } from "crypto";

export const sha256 = (value: string) => {
  return createHash("sha256").update(value).digest("hex");
};
