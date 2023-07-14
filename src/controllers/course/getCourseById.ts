import { Request, Response } from "express";
import { courseRepository } from "../../repositories/courseRepository";
import { z } from "zod";
import { validate } from "../../utils/zodValidateRequest";

const dataSchema = z.object({
  params: z.object({
    id: z
      .string({
        invalid_type_error: "id not a string",
        required_error: "id is a required path parameter",
      })
      .min(0, {
        message: "id must be a non-empty string",
      })
      .uuid({ message: "id must be a valid uuid" }),
  }),
});

export const getCourseByIdValidator = validate(dataSchema);

export const getCourseById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const course = await courseRepository
      .createQueryBuilder("course")
      .where("course.id = :id", { id })
      .getOne();

    if (!course) {
      return res.status(404).json({ message: "Course does not exist" });
    }

    return res.json(course);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
