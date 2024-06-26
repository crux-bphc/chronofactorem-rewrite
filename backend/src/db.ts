import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./config/server.js";
import {
  Announcement,
  Course,
  SearchHistory,
  Section,
  Timetable,
  User,
} from "./entity/entities.js";
import { DatabaseLogger, databaseLogger } from "./utils/logger.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.DB_HOST}:${env.PGPORT}?db=${env.POSTGRES_DB}`,
  synchronize: true,
  logging: false,
  entities: [User, Timetable, Course, Section, SearchHistory, Announcement],
  migrations: [],
  subscribers: [],
  logger: new DatabaseLogger(databaseLogger),
});
