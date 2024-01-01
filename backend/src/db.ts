import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./config/server.js";
import {
  Course,
  SearchHistory,
  Section,
  Timetable,
  User,
} from "./entity/entities.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.DB_HOST}:${env.PGPORT}?db=${env.POSTGRES_DB}`,
  synchronize: true,
  logging: false,
  entities: [User, Timetable, Course, Section, SearchHistory],
  migrations: [],
  subscribers: [],
});
