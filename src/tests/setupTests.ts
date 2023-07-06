import { configDotenv } from "dotenv";
import timetableTestJSON from "./timetable.test.json";
import { ingestJSON } from "../ingestJSON";
import { AppDataSource } from "../db";

module.exports = async () => {
  configDotenv({ path: "../.env.example" });

  await AppDataSource.initialize();

  // Fetch all the entities so we can clear all
  const entities = AppDataSource.entityMetadatas;

  for (const entity of entities) {
    console.log(`Clearing all ${entity.tableName}...`);
    AppDataSource.createEntityManager().query(
      `TRUNCATE TABLE "${entity.tableName}" CASCADE;`
    );
  }

  // Ingest testing data
  console.log("connecting to db...");
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  console.log("connected!");
  await ingestJSON(timetableTestJSON, queryRunner);

  await queryRunner.release();
  await AppDataSource.destroy();
};
