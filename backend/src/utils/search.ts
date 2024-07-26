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
    if (!res.ok) {
      const resJson = await res.json();
      logger.error(
        `Error while adding timetable ${timetable.id} to search service: ${resJson.error}`,
      );
    }
  } catch (err: any) {
    logger.error(
      `Error while adding timetable ${timetable.id} to search service: ${
        "message" in err ? err.message : err
      }`,
    );
    throw err;
  }
};

export const removeTimetable = async (
  timetableId: number,
  logger: Logger | Console,
) => {
  try {
    const searchServiceURL = `${env.SEARCH_SERVICE_URL}/timetable/remove`;
    const encodedId = sqids.encode([timetableId]);
    const res = await fetch(searchServiceURL, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: encodedId }),
    });
    if (!res.ok) {
      const resJson = await res.json();
      logger.error(
        `Error while removing timetable ${timetableId} from search service: ${resJson.error}`,
      );
    }
  } catch (err: any) {
    logger.error(
      `Error while removing timetable ${timetableId} from search service: ${
        "message" in err ? err.message : err
      }`,
    );
    throw err;
  }
};
