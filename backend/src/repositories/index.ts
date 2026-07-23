import { AppDataSource } from "../db.js";
import {
  Announcement,
  Course,
  Section,
  Timetable,
  User,
} from "../entity/entities.js";

export const announcementRepository = AppDataSource.getRepository(Announcement);
export const courseRepository = AppDataSource.getRepository(Course);
export const sectionRepository = AppDataSource.getRepository(Section);
export const timetableRepository = AppDataSource.getRepository(Timetable);
export const userRepository = AppDataSource.getRepository(User);
