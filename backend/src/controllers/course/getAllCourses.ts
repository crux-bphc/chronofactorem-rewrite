import { Request, Response } from "express";
import { z } from "zod";
import { Course } from "../../entity/entities.js";
import { validate } from "../../middleware/zodValidateRequest.js";
import { courseRepository } from "../../repositories/courseRepository.js";

const dataSchema = z.object({
  query: z.object({
    // This type definition for archived is not ideal, but boolean() doesn't work directly as the param is read as a string, and coercing it to boolean makes all values pass the check, rendering this check useless. Thus, this is the current solution
    archived: z.union([z.literal("true"), z.literal("false")]).optional(),
  }),
});

export const getAllCoursesValidator = validate(dataSchema);

export const getAllCourses = async (req: Request, res: Response) => {
  const logger = req.log;
  // note that if archived is not passed as a param, (req.query.archived as string) evaluates to the string "undefined"
  const archived: boolean = (req.query.archived as string) === "true";

  try {
    let courses: Course[];

    if (archived) {
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
    logger.error("An error occurred while fetching courses:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
