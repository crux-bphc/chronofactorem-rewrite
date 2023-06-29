import { AppDataSource } from "../db";
import { Course } from "../entity/Course";

export const courseRepository = AppDataSource.getRepository(Course);
