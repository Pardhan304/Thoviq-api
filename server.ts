import { app } from "./app.js";
import { env } from "./config/env.js";

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`[THOVIQ-API] Server running on http://localhost:${PORT} in ${env.NODE_ENV} mode`);
});