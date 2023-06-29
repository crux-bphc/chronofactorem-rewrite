import { Request, Response } from "express";
import { timetableRepository } from "../../repositories/timetableRepository";
import { Timetable } from "../../entity/Timetable";
import { z } from "zod";
import { validate } from "../../utils/zodValidateRequest";
import { Section } from "../../entity/Section";
import { User } from "../../entity/User";
import { userRepository } from "../../repositories/userRepository";
import { SectionTypeZodList } from "../../types/sectionTypes";
import { sectionRepository } from "../../repositories/sectionRepository";
import {
  checkForClassHoursClash,
  checkForExamHoursClash,
} from "../../utils/checkForClashes";
import { Course } from "../../entity/Course";
import { courseRepository } from "../../repositories/courseRepository";

const dataSchema = z.object({
  body: z.object({
    // auth temp replacement
    email: z
      .string({
        invalid_type_error: "email not a string",
        required_error: "email is a required path parameter",
      })
      .min(0, {
        message: "email must be a non-empty string",
      })
      .regex(
        /^([A-Z0-9_+-]+\.?)*[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i,
        {
          message: "email must be a valid email",
        }
      ),
    courseId: z
      .string({
        invalid_type_error: "courseId not a string",
        required_error: "courseId is a required path parameter",
      })
      .min(0, {
        message: "courseId must be a non-empty string",
      }),

    sectionType: SectionTypeZodList.min(1, {
      message: "sectionType must be a non-empty array of valid section types",
    }).max(2, {
      message: "sectionType may not contain more than two elements",
    }),

    sectionNumber: z.coerce
      .number({
        invalid_type_error: "id not a number",
        required_error: "id is a required path parameter",
      })
      .positive({
        message: "invalid id",
      })
      .int({
        message: "invalid id",
      }),
  }),
  params: z.object({
    id: z.coerce
      .number({
        invalid_type_error: "id not a number",
        required_error: "id is a required path parameter",
      })
      .positive({
        message: "invalid id",
      })
      .int({
        message: "invalid id",
      }),
  }),
});

export const addSectionValidator = validate(dataSchema);

export const addSection = async (req: Request, res: Response) => {
  const timetableId = parseInt(req.params.id);
  const courseId = req.body.courseId;
  const sectionType = req.body.sectionType[0];
  const sectionNumber = parseInt(req.body.sectionNumber);
  const email = req.body.email;

  try {
    let author: User | null = null;

    try {
      author = await userRepository
        .createQueryBuilder("user")
        .where("user.email = :email", { email: email })
        .getOne();
    } catch (err: any) {
      // will replace the console.log with a logger when we have one
      console.log("Error while querying user: ", err.message);

      res.status(500).json({ message: "Internal Server Error" });
    }

    if (!author) {
      return res.json({ message: "unregistered user" });
    }

    let timetable: Timetable | null = null;

    try {
      timetable = await timetableRepository
        .createQueryBuilder("timetable")
        .where("timetable.id = :id", { id: timetableId })
        .getOne();
    } catch (err: any) {
      // will replace the console.log with a logger when we have one
      console.log("Error while querying timetable: ", err.message);

      res.status(500).json({ message: "Internal Server Error" });
    }

    if (!timetable) {
      return res.json({ message: "timetable not found" });
    }

    if (timetable.authorId !== author.id) {
      return res.status(403).json({ message: "user does not own timetable" });
    }

    let section: Section | null = null;

    try {
      section = await sectionRepository
        .createQueryBuilder("section")
        .where("section.courseId = :courseId", { courseId: courseId })
        .andWhere("section.type = :sectionType", {
          sectionType: sectionType,
        })
        .andWhere("section.number = :sectionNumber", {
          sectionNumber: sectionNumber,
        })
        .getOne();
    } catch (err: any) {
      // will replace the console.log with a logger when we have one
      console.log("Error while querying for section: ", err.message);

      res.status(500).json({ message: "Internal Server Error" });
    }

    if (!section) {
      return res.status(404).json({ message: "section not found" });
    }

    const classHourClashes = checkForClassHoursClash(timetable, section);
    if (classHourClashes.clash) {
      return res.status(400).json({
        message: `section clashes with ${classHourClashes.course}`,
      });
    }

    let course: Course | null = null;

    try {
      course = await courseRepository
        .createQueryBuilder("course")
        .where("course.id = :id", { id: courseId })
        .getOne();
    } catch (err: any) {
      // will replace the console.log with a logger when we have one
      console.log("Error while querying for course: ", err.message);

      res.status(500).json({ message: "Internal Server Error" });
    }

    if (!course) {
      return res.status(404).json({ message: "course not found" });
    }

    const examHourClashes = checkForExamHoursClash(timetable, course);
    if (examHourClashes.clash) {
      return res.status(400).json({
        message: `course clashes with ${examHourClashes.course}'s ${examHourClashes.exam}`,
      });
    }

    try {
      await timetableRepository
        .createQueryBuilder("timetable")
        .relation(Timetable, "sections")
        .of(timetable)
        .add(section);

      let newTimes: string[] = [];

      section.roomTime.forEach((time) => {
        const [_, day, hour] = time.split(":");
        newTimes.push(course?.code + ":" + day + hour);
      });

      await timetableRepository.manager.transaction(
        async (transactionalEntityManager) => {
          // shoudn't be needed, but kept them here as it was erroring out
          if (!course) {
            return res.status(404).json({ message: "course not found" });
          }
          if (!timetable) {
            return res.status(404).json({ message: "timetable not found" });
          }
          await transactionalEntityManager
            .createQueryBuilder()
            .update(Timetable)
            .set({ timings: [...timetable.timings, ...newTimes] })
            .where("timetable.id = :id", { id: timetable.id })
            .execute();

          if (!examHourClashes.sameCourse) {
            await transactionalEntityManager
              .createQueryBuilder()
              .update(Timetable)
              .set({
                examTimes: [
                  ...timetable.examTimes,
                  `${
                    course.code
                  }|${course.midsemStartTime.toISOString()}|${course.midsemEndTime.toISOString()}`,
                  `${
                    course.code
                  }|${course.compreStartTime.toISOString()}|${course.compreEndTime.toISOString()}`,
                ],
              })
              .where("timetable.id = :id", { id: timetable?.id })
              .execute();
          }
        }
      );
    } catch (err: any) {
      // will replace the console.log with a logger when we have one
      console.log("Error while updating timetable with section: ", err.message);

      res.status(500).json({ message: "Internal Server Error" });
    }
    res.json({ message: "section added" });
  } catch (err: any) {
    throw err;
  }
};
