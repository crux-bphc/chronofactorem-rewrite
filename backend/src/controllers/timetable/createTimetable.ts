import type { Request, Response } from "express";
import type { degreeEnum } from "lib";
import { type Section, Timetable } from "../../entity/entities.js";
import { timetableRepository } from "../../repositories/index.js";
import timetableJSON from "../../timetable.json" with { type: "json" };
import sqids from "../../utils/sqids.js";
import { fetchAuthorOrError, queryOr500 } from "./helpers.js";

export const createTimetable = async (req: Request, res: Response) => {
  const logger = req.log;
  const author = await fetchAuthorOrError(
    req,
    res,
    logger,
    "Error while querying for user: ",
  );
  if (!author) {
    return;
  }

  // new timetable default properties
  const name = "Untitled Timetable";
  const degrees: degreeEnum[] = author.degrees;
  const isPrivate = true;
  const isDraft = true;
  const isArchived = false;
  const acadYear = timetableJSON.metadata.acadYear;
  const year: number = acadYear - author.batch + 1;
  const semester = timetableJSON.metadata.semester;
  const sections: Section[] = [];
  const timings: string[] = [];
  const examTimes: string[] = [];
  const warnings: string[] = [];
  const createdAt: Date = new Date();
  const lastUpdated: Date = new Date();
  const authorId: string = author.id;

  const timetableID = await queryOr500(
    res,
    logger,
    "Error while creating timetable: ",
    async () => {
      const createdTimetable = await timetableRepository
        .createQueryBuilder()
        .insert()
        .into(Timetable)
        .values({
          authorId,
          name,
          degrees,
          private: isPrivate,
          draft: isDraft,
          archived: isArchived,
          acadYear,
          semester,
          year,
          sections,
          timings,
          examTimes,
          warnings,
          createdAt,
          lastUpdated,
        })
        .execute();

      return sqids.encode([createdTimetable.identifiers[0].id]);
    },
  );
  if (timetableID === undefined) {
    return;
  }
  return res.status(201).json({
    message: "Timetable created successfully",
    id: timetableID,
  });
};
