import { Request, Response } from "express";
import { courseRepository } from "../../repositories/courseRepository";

export const getAllUsers = async (req: Request, res: Response) => {
  const courses = await courseRepository.find({});
  console.log(courses);

  if (courses.length === 0) {
    return res.json({ message: "no courses" });
  }
  return res.json(courses);
};
