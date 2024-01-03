import { AppDataSource } from "../db.js";

module.exports = async () => {
  await AppDataSource.initialize();
  // Fetch all the entities so we can clear all
  const entities = AppDataSource.entityMetadatas;

  for (const entity of entities) {
    console.log(`Clearing all ${entity.tableName}...`);
    AppDataSource.createEntityManager().query(
      `TRUNCATE TABLE "${entity.tableName}" CASCADE;`,
    );
  }
  await AppDataSource.destroy();
};
