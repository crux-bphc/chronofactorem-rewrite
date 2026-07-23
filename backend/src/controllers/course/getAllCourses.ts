import type { Request, Response } from "express";
import { z } from "zod";
import type { Course } from "../../entity/entities.js";
import { validate } from "../../middleware/zodValidateRequest.js";
import { courseRepository } from "../../repositories/index.js";

const dataSchema = z.object({
  query: z
    .object({
      // This type definition for archived is not ideal, but boolean() doesn't work directly as the param is read as a string, and coercing it to boolean makes all values pass the check, rendering this check useless. Thus, this is the current solution
      archived: z.union([z.literal("true"), z.literal("false")]).optional(),
      acadYear: z.coerce.number().int().optional(),
      semester: z.coerce.number().int().optional(),
    })
    .refine(
      (query) => {
        const hasAcadYear = query.acadYear !== undefined;
        const hasSemester = query.semester !== undefined;
        // one param without the other is meaningless
        return hasAcadYear === hasSemester;
      },
      { message: "acadYear and semester must be passed together" },
    ),
});

export const getAllCoursesValidator = validate(dataSchema);

export const getAllCourses = async (req: Request, res: Response) => {
  const logger = req.log;
  // note that if archived is not passed as a param, (req.query.archived as string) evaluates to the string "undefined"
  const archived: boolean = (req.query.archived as string) === "true";
  const acadYear = req.query.acadYear as string | undefined;
  const semester = req.query.semester as string | undefined;

  try {
    let courses: Course[];

    if (acadYear !== undefined && semester !== undefined) {
      // semester-scoped fetches return the courses of that semester regardless
      // of their archived status, so that archived timetables can be viewed
      courses = await courseRepository
        .createQueryBuilder("course")
        .where("course.acadYear = :acadYear", { acadYear: Number(acadYear) })
        .andWhere("course.semester = :semester", {
          semester: Number(semester),
        })
        .getMany();
    } else if (archived) {
      courses = await courseRepository.createQueryBuilder("course").getMany();
    } else {
      courses = await courseRepository
        .createQueryBuilder("course")
        .where("course.archived = :archived", { archived: archived })
        .getMany();
    }

    if (courses.length === 0) {
      return res.status(404).json({ message: "Courses do not not exist" });
    }

    return res.header("Cache-Control", "max-age=3600").json(courses);
  } catch (error) {
    logger.error(error, "An error occurred while fetching courses:");
    return res.status(500).json({ message: "Internal server error" });
  }
};
