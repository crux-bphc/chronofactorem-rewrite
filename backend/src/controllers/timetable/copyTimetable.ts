import type { Request, Response } from "express";
import { type degreeEnum, timetableIDType } from "lib";
import { z } from "zod";
import { type Section, Timetable } from "../../entity/entities.js";
import { validate } from "../../middleware/zodValidateRequest.js";
import { timetableRepository } from "../../repositories/index.js";
import timetableJSON from "../../timetable.json" with { type: "json" };
import sqids from "../../utils/sqids.js";
import {
  decodeTimetableSqidOr404,
  fetchAuthorOrError,
  fetchTimetableOrError,
  queryOr500,
} from "./helpers.js";

const dataSchema = z.object({
  params: z.object({
    id: timetableIDType,
  }),
});

export const copyTimetableValidator = validate(dataSchema);

export const copyTimetable = async (req: Request, res: Response) => {
  const logger = req.log;
  const dbID = decodeTimetableSqidOr404(req, res);
  if (dbID === null) {
    return;
  }

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
  let timings: string[] = [];
  let examTimes: string[] = [];
  let warnings: string[] = [];
  const createdAt: Date = new Date();
  const lastUpdated: Date = new Date();
  const authorId: string = author.id;

  const copiedTimetable = await fetchTimetableOrError(res, logger, dbID, {
    joinSections: true,
    notFoundMessage: "timetable to be copied not found",
    queryErrorLogMessage: "Error while querying for timetable: ",
  });
  if (!copiedTimetable) {
    return;
  }

  if (copiedTimetable.archived) {
    return res
      .status(400)
      .json({ message: "timetable is archived. cannot copy old timetables" });
  }

  timings = copiedTimetable.timings;
  examTimes = copiedTimetable.examTimes;
  warnings = copiedTimetable.warnings;

  const timetableID = await queryOr500(
    res,
    logger,
    "Error while copying timetable: ",
    async () => {
      const timetable = await timetableRepository
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

      const sectionsCopied = await queryOr500(
        res,
        logger,
        "Error while copying sections into new timetable: ",
        async () => {
          for (let i = 0; i < copiedTimetable.sections.length; i++) {
            const section = copiedTimetable.sections[i];
            await timetableRepository
              .createQueryBuilder()
              .relation(Timetable, "sections")
              .of(timetable.identifiers[0].id)
              .add(section);
          }
          return true;
        },
      );
      if (sectionsCopied === undefined) {
        return undefined;
      }

      return sqids.encode([timetable.identifiers[0].id]);
    },
  );
  if (timetableID === undefined) {
    return;
  }
  return res.status(201).json({
    message: "Timetable copied successfully",
    id: timetableID,
  });
};
