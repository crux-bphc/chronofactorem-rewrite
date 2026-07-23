import { AppDataSource, initializeDataSource } from "./db.js";
import { ingestJSON } from "./ingestJSON.js";
import timetableJSON from "./timetable.json" with { type: "json" };

initializeDataSource()
  .then(async () => {
    // create a query runner to make it easier to create transactions across typeorm function calls
    console.log("connecting to db...");
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    console.log("connected!");

    await ingestJSON(timetableJSON, queryRunner);

    await queryRunner.release();
    await AppDataSource.destroy();
  })
  .catch(async (error) => {
    console.log(error);
    process.exitCode = 1;
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });
