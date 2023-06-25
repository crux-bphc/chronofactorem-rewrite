import { AppDataSource } from "../db";
import { Section } from "../entity/Section";

export const sectionRepository = AppDataSource.getRepository(Section);
