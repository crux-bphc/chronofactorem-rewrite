import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entity/User";
import { env } from "./config/server";
import { Timetable } from "./entity/Timetable";
import { Course } from "./entity/Course";
import { Section } from "./entity/Section";
import { SearchHistory } from "./entity/SearchHistory";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.DB_HOST}:5432?db=${env.POSTGRES_DB}`,
  synchronize: true,
  logging: false,
  entities: [User, Timetable, Course, Section, SearchHistory],
  migrations: [],
  subscribers: [],
});
