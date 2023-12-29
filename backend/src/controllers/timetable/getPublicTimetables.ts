import { Request, Response } from "express";
import { z } from "zod";
import { Timetable } from "../../entity/Timetable";
import { User } from "../../entity/User";
import { validate } from "../../middleware/zodValidateRequest";
import { timetableRepository } from "../../repositories/timetableRepository";
import { userRepository } from "../../repositories/userRepository";
import {
  degreeList,
  namedDegreeZodList,
  isAValidDegreeCombination,
  namedCollegeYearType,
  namedSemesterType,
} from "../../../../lib";

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
  }),
});

export const getPublicTimetablesValidator = validate(dataSchema);

export const getPublicTimetables = async (req: Request, res: Response) => {
  try {
    let user: User | null = null;
    try {
      // get user email from the cookie later, for now it's passed as a query param
      user = await userRepository
        .createQueryBuilder("user")
        .where("user.id = :id", { id: req.session?.id })
        .getOne();
    } catch (err: any) {
      // will replace the console.log with a logger when we have one
      console.log("Error while querying for user: ", err.message);

      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const branch: degreeList = req.query.branch as degreeList;
    const year: number = parseInt(req.query.year as string);
    const sem: number = parseInt(req.query.sem as string);
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

    try {
      let timetables: Timetable[] | null = null;
      timetables = await queryBuilder.getMany();

      return res.json(timetables);
    } catch (err: any) {
      // will replace the console.log with a logger when we have one
      console.log("Error while querying timetable: ", err.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } catch (err: any) {
    return err;
  }
};
