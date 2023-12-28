import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./config/server";
import { Course } from "./entity/Course";
import { SearchHistory } from "./entity/SearchHistory";
import { Section } from "./entity/Section";
import { Timetable } from "./entity/Timetable";
import { User } from "./entity/User";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.DB_HOST}:${env.PGPORT}?db=${env.POSTGRES_DB}`,
  synchronize: true,
  logging: false,
  entities: [User, Timetable, Course, Section, SearchHistory],
  migrations: [],
  subscribers: [],
});
