import { AppDataSource } from "../db.js";
import { Course } from "../entity/entities.js";

export const courseRepository = AppDataSource.getRepository(Course);
