import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entity/User";
import { env } from "../config/server";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: `socket://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_SOCKET}?db=${env.POSTGRES_DB}`,
  synchronize: true,
  logging: false,
  entities: [User],
  migrations: [],
  subscribers: [],
});
