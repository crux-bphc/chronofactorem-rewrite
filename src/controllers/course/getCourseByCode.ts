import { Request, Response } from "express";
import { courseRepository } from "../../repositories/courseRepository";
import { z } from "zod";

// Define the validation schema for the path parameters
const paramsSchema = z.object({
  
    code: z.string().regex(/^[a-zA-Z0-9]+$/).min(1),
});

export const getCourseByCode = async (req: Request, res: Response) => {
  try {
    
    const { code } = paramsSchema.parse(req.params);

    const course = await courseRepository
      .createQueryBuilder("course")
      .where("course.code = :code", { code })
      .getOne();

    if (!course) {
      return res.json({ message: "Course does not exist" });
    }

    return res.json(course);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

