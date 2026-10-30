// Deployment entry point: seed only a fresh instance, preserving user data on restarts.
import app from "./app.js";
import { env } from "./config/server.js";
import { AppDataSource, initializeDataSource } from "./db.js";
import { Course } from "./entity/entities.js";
import { ingestJSON } from "./ingestJSON.js";
import timetableJSON from "./timetable.json" with { type: "json" };

try {
  await initializeDataSource();
  if (await AppDataSource.getRepository(Course).count() === 0) {
    const runner = AppDataSource.createQueryRunner();
    await runner.connect();
    try {
      await ingestJSON(timetableJSON, runner);
    } finally {
      await runner.release();
    }
    if (await AppDataSource.getRepository(Course).count() === 0) {
      throw new Error("Course ingestion did not populate the database");
    }
  }
  app.get("/healthz", async (_req, res) => {
    try {
      await AppDataSource.query("SELECT 1");
      res.json({ status: "ok" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });
  app.listen(env.BACKEND_PORT);
} catch (error) {
  console.error(error);
  process.exit(1);
}
