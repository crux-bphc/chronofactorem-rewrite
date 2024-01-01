import { AppDataSource } from "../db.js";
import { Timetable } from "../entity/entities.js";

export const timetableRepository = AppDataSource.getRepository(Timetable);
