import { AppDataSource } from "../db.js";
import { Announcement } from "../entity/entities.js";

export const announcementRepository = AppDataSource.getRepository(Announcement);
