import "dotenv/config";
import app from "./app";
import { env } from "./config/server";
import { AppDataSource } from "./db";

AppDataSource.initialize()
  .then(async () => {
    // start express server
    app.listen(env.BACKEND_PORT);

    console.log(
      `Express server has started on port ${env.BACKEND_PORT}. Open http://localhost:${env.BACKEND_PORT}/ to see results`,
    );
  })
  .catch((error) => console.log(error));
