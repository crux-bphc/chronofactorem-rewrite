import { AppDataSource } from "../db.js";
import { User } from "../entity/entities.js";

export const userRepository = AppDataSource.getRepository(User);
