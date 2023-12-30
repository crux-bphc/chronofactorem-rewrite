import { Request, Response } from "express";
import { z } from "zod";
import { Course } from "../../entity/Course";
import { validate } from "../../middleware/zodValidateRequest";
import { courseRepository } from "../../repositories/courseRepository";

const dataSchema = z.object({
  query: z.object({
    archived: z.union([z.literal("true"), z.literal("false")]).optional(),
  }),
});

export const getAllCoursesValidator = validate(dataSchema);

export const getAllCourses = async (req: Request, res: Response) => {
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
    console.error("An error occurred while fetching courses:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
