import { Request, Response } from "express";
import { courseRepository } from "../../repositories/courseRepository";

export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const courses = await courseRepository
      .createQueryBuilder("course")
      .getMany();

    if (courses.length === 0) {
      return res.status(404).json({ message: "Course does not exist" });
    }

    return res.json(courses);
  } catch (error) {
    console.error("An error occurred while fetching courses:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
