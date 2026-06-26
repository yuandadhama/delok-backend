import { app } from "./app";

const port = 8000;

app.listen(port, () => {
  console.info(`Server listen at http://localhost:${port}`);
});
