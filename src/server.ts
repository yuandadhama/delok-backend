import "dotenv/config";
import { app } from "./app";

const port = process.env.PORT;

app.listen(port, () => {
  console.info(`Server listen at http://localhost:${port}`);
});
