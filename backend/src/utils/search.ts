import "dotenv/config";
import { Logger } from "pino";
import { env } from "../config/server.js";
import { Timetable } from "../entity/entities.js";
import { userRepository } from "../repositories/userRepository.js";
import sqids from "./sqids.js";

export const addTimetable = async (
  timetable: Timetable,
  authorEmail: string | null,
  logger: Logger | Console,
) => {
  try {
    const searchServiceURL = `${env.SEARCH_SERVICE_URL}/timetable/add`;
    const encodedId = sqids.encode([timetable.id]);
    const email =
      authorEmail ??
      (
        await userRepository
          .createQueryBuilder("user")
          .where("user.id = :id", { id: timetable.authorId })
          .getOneOrFail()
      ).email;
    const authorId = email.slice(0, 9);
    const modifiedTimetable = {
      ...timetable,
      id: encodedId,
      authorId,
    };
    const res = await fetch(searchServiceURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(modifiedTimetable),
    });
    const resJson = await res.json();
    if (!res.ok) {
      logger.error(
        "Error while adding timetable to search service: ",
        resJson.error,
      );
    }
  } catch (err: any) {
    logger.error(
      "Error while adding timetable to search service: ",
      err.message,
    );
    throw err;
  }
};
