import "dotenv/config";
import { app } from "./app";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

const port = process.env.PORT;

// auth route better auth setting
// app.all("/api/auth/*", toNodeHandler(auth));

// start server
app.listen(port, () => {
  console.info(`Server listen at http://localhost:${port}`);
});
