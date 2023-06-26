import { Request, Response } from "express";
import { courseRepository } from "../../repositories/courseRepository";

export const getCourseByCode = async (req: Request, res: Response) => {
  const code = req.params.code;

  console.log(code);

  const course = await courseRepository.findOne({
    where: { code },
  });
  console.log(course);

  if (!course) {
    return res.json({ message: "Course does not exist" });
  }
  return res.json(course);
};