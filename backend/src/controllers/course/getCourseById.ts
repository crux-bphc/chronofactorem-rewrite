import { Request, Response } from "express";
import { z } from "zod";
import { namedUUIDType } from "../../../../lib/src/index.js";
import { validate } from "../../middleware/zodValidateRequest.js";
import { courseRepository } from "../../repositories/courseRepository.js";

const dataSchema = z.object({
  params: z.object({
    id: namedUUIDType("course"),
  }),
});

export const getCourseByIdValidator = validate(dataSchema);

export const getCourseById = async (req: Request, res: Response) => {
  const logger = req.log;
  try {
    const id = req.params.id as string;
    const course = await courseRepository
      .createQueryBuilder("course")
      .where("course.id = :id", { id })
      .leftJoinAndSelect(
        "course.sections",
        "section",
        "section.course = :courseId",
        { courseId: id },
      )
      .getOne();

    if (!course) {
      return res.status(404).json({ message: "Course does not exist" });
    }

    return res.json(course);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
