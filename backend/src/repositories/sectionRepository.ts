import { AppDataSource } from "../db.js";
import { Section } from "../entity/entities.js";

export const sectionRepository = AppDataSource.getRepository(Section);
