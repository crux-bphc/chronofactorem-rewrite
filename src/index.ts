import { AppDataSource } from "./db";
import "dotenv/config";
import { env } from "./config/server";
import app from "./app";

AppDataSource.initialize()
  .then(async () => {
    // start express server
    app.listen(env.PORT);

    console.log(
      `Express server has started on port ${env.PORT}. Open http://localhost:${env.PORT}/ to see results`
    );
  })
  .catch((error) => console.log(error));
