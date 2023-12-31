import "dotenv/config";
import { AppDataSource } from "./db.js";
import { ingestJSON } from "./ingestJSON.js";
import timetableJSON from "./timetable.json" with { type: "json" };

AppDataSource.initialize()
  .then(async () => {
    // create a query runner to make it easier to create transactions across typeorm function calls
    console.log("connecting to db...");
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    console.log("connected!");

    await ingestJSON(timetableJSON, queryRunner);

    await queryRunner.release();
  })
  .catch((error) => console.log(error));
