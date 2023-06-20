import { AppDataSource } from "../db";
import { Timetable } from "../entity/Timetable";

export const timetableRepository = AppDataSource.getRepository(Timetable);
