import type { Request, Response } from "express";
import type { sectionTypeList } from "lib";
import type { Logger } from "pino";
import type { EntityManager } from "typeorm";
import { Section, type Timetable, type User } from "../../entity/entities.js";
import {
  timetableRepository,
  userRepository,
} from "../../repositories/index.js";
import sqids, { validSqid } from "../../utils/sqids.js";

// Runs the given query. On failure, logs `logMessage` with the error and sends
// a 500 response, then returns undefined so the caller can stop handling the
// request. Any other value (including null) is the query's own result.
export const queryOr500 = async <T>(
  res: Response,
  logger: Logger,
  logMessage: string,
  query: () => Promise<T>,
): Promise<T | undefined> => {
  try {
    return await query();
  } catch (err: any) {
    logger.error(logMessage, err.message);
    res.status(500).json({ message: "Internal Server Error" });
    return undefined;
  }
};

// Fetches the user behind the current session. Sends a 500 on query error and
// a 401 if the user is not registered; returns null in both cases.
export const fetchAuthorOrError = async (
  req: Request,
  res: Response,
  logger: Logger,
  queryErrorLogMessage: string,
): Promise<User | null> => {
  const author = await queryOr500(res, logger, queryErrorLogMessage, () =>
    userRepository
      .createQueryBuilder("user")
      .where("user.id = :id", { id: req.session?.id })
      .getOne(),
  );
  if (author === undefined) {
    return null;
  }
  if (!author) {
    res.status(401).json({ message: "unregistered user" });
    return null;
  }
  return author;
};

// Decodes the sqid timetable id from the request params. Sends a 404 and
// returns null if it is not a valid sqid.
export const decodeTimetableSqidOr404 = (
  req: Request,
  res: Response,
): number[] | null => {
  const dbID = sqids.decode(req.params.id as string);
  if (!validSqid(dbID)) {
    res.status(404).json({ message: "Timetable does not exist" });
    return null;
  }
  return dbID;
};

// Fetches a timetable by decoded id, optionally loading its sections and
// enforcing ownership and draft/archived state. Sends the matching error
// response and returns null on any failure.
export const fetchTimetableOrError = async (
  res: Response,
  logger: Logger,
  dbID: number[],
  options: {
    authorId?: string;
    joinSections?: boolean;
    mustBeDraft?: boolean;
    notFoundMessage?: string;
    queryErrorLogMessage: string;
  },
): Promise<Timetable | null> => {
  let timetableQuery = timetableRepository
    .createQueryBuilder("timetable")
    .where("timetable.id = :id", { id: dbID[0] });
  if (options.joinSections) {
    timetableQuery = timetableQuery.leftJoinAndSelect(
      "timetable.sections",
      "section",
    );
  }
  const timetable = await queryOr500(
    res,
    logger,
    options.queryErrorLogMessage,
    () => timetableQuery.getOne(),
  );
  if (timetable === undefined) {
    return null;
  }
  if (!timetable) {
    res
      .status(404)
      .json({ message: options.notFoundMessage ?? "timetable not found" });
    return null;
  }
  if (
    options.authorId !== undefined &&
    timetable.authorId !== options.authorId
  ) {
    res.status(403).json({ message: "user does not own timetable" });
    return null;
  }
  if (options.mustBeDraft) {
    if (!timetable.draft) {
      res.status(418).json({ message: "timetable is not a draft" });
      return null;
    }
    if (timetable.archived) {
      res.status(418).json({ message: "timetable is archived" });
      return null;
    }
  }
  return timetable;
};

// Fetches the distinct section types of a course.
export const getCourseSectionTypes = async (
  manager: EntityManager,
  courseId: string,
): Promise<sectionTypeList> => {
  const sectionTypeHolders = await manager
    .createQueryBuilder(Section, "section")
    .select("section.type")
    .where("section.courseId = :courseId", { courseId })
    .distinctOn(["section.type"])
    .getMany();
  return sectionTypeHolders.map((section) => section.type);
};
