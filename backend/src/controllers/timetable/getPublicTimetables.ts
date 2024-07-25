import { Request, Response } from "express";
import { z } from "zod";
import {
  degreeList,
  isAValidDegreeCombination,
  namedCollegeYearType,
  namedDegreeZodList,
  namedSemesterType,
} from "../../../../lib/src/index.js";
import { Timetable, User } from "../../entity/entities.js";
import { validate } from "../../middleware/zodValidateRequest.js";
import { timetableRepository } from "../../repositories/timetableRepository.js";
import { userRepository } from "../../repositories/userRepository.js";
import sqids from "../../utils/sqids.js";

const dataSchema = z.object({
  query: z.object({
    year: namedCollegeYearType("search").optional(),
    sem: namedSemesterType("search").optional(),
    branch: namedDegreeZodList("search branch")
      .min(1, {
        message:
          "search branch must be a non-empty array of valid degree strings",
      })
      .max(2, {
        message: "search branch may not contain more than two elements",
      })
      .optional(),
    // This type definition for archived is not ideal, but boolean() doesn't work directly as the param is read as a string, and coercing it to boolean makes all values pass the check, rendering this check useless. Thus, this is the current solution
    archived: z.union([z.literal("true"), z.literal("false")]).optional(),
  }),
});

export const getPublicTimetablesValidator = validate(dataSchema);

export const getPublicTimetables = async (req: Request, res: Response) => {
  const logger = req.log;
  try {
    let user: User | null = null;
    try {
      // get user email from the cookie later, for now it's passed as a query param
      user = await userRepository
        .createQueryBuilder("user")
        .where("user.id = :id", { id: req.session?.id })
        .getOne();
    } catch (err: any) {
      logger.error("Error while querying for user: ", err.message);

      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const branch: degreeList = req.query.branch as degreeList;
    const year: number = parseInt(req.query.year as string);
    const sem: number = parseInt(req.query.sem as string);
    // note that if archived is not passed as a param, (req.query.archived as string) evaluates to the string "undefined"
    const archived: boolean = (req.query.archived as string) === "true";
    const isPrivate = false;

    let queryBuilder = timetableRepository
      .createQueryBuilder("timetable")
      .select([
        "timetable.id",
        "timetable.name",
        "timetable.degrees",
        "timetable.private",
        "timetable.draft",
        "timetable.archived",
        "timetable.acadYear",
        "timetable.year",
        "timetable.semester",
        "timetable.createdAt",
        "timetable.lastUpdated",
      ])
      .where("timetable.private = :isPrivate", { isPrivate });

    if (branch) {
      if (branch.length === 2 && !isAValidDegreeCombination(branch)) {
        return res.status(400).json({
          message:
            "Branch may only have one valid BE degree and one valid MSc degee",
        });
      }
      queryBuilder = queryBuilder.andWhere("timetable.degrees = :branch", {
        branch,
      });
    }

    if (year) {
      queryBuilder = queryBuilder.andWhere("timetable.year = :year", { year });
    }

    if (sem) {
      queryBuilder = queryBuilder.andWhere("timetable.semester = :sem", {
        sem,
      });
    }

    if (!archived) {
      queryBuilder = queryBuilder.andWhere("timetable.archived = :archived", {
        archived,
      });
    }

    try {
      let timetables: Timetable[] | null = null;
      timetables = await queryBuilder.getMany();

      const timetablesWithEncodedIDs = timetables.map((t) => {
        return { ...t, id: sqids.encode([t.id]) };
      });

      return res.json(timetablesWithEncodedIDs);
    } catch (err: any) {
      logger.error("Error while querying timetable: ", err.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } catch (err: any) {
    return err;
  }
};
