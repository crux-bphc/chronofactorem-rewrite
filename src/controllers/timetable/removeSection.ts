import { z } from "zod";
import { validate } from "../../utils/zodValidateRequest";
import { Request, Response } from "express";
import { Section } from "../../entity/Section";
import { Timetable } from "../../entity/Timetable";
import { User } from "../../entity/User";
import { sectionRepository } from "../../repositories/sectionRepository";
import { timetableRepository } from "../../repositories/timetableRepository";
import { userRepository } from "../../repositories/userRepository";
import { Course } from "../../entity/Course";
import { courseRepository } from "../../repositories/courseRepository";
import { updateSectionWarnings } from "../../utils/updateWarnings";
import { SectionTypeList } from "../../types/sectionTypes";

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

    sectionId: z
      .string({
        invalid_type_error: "id not a string",
        required_error: "id is a required parameter",
      })
      .min(0, {
        message: "id must be a non-empty string",
      })
      .uuid({ message: "id must be a valid uuid" }),
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

export const removeSectionValidator = validate(dataSchema);

export const removeSection = async (req: Request, res: Response) => {
  const timetableId = parseInt(req.params.id);
  const sectionId = req.body.sectionId;
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
      return res.status(401).json({ message: "unregistered user" });
    }

    let timetable: Timetable | null = null;

    try {
      timetable = await timetableRepository
        .createQueryBuilder("timetable")
        .leftJoinAndSelect("timetable.sections", "section")
        .where("timetable.id = :id", { id: timetableId })
        .getOne();
    } catch (err: any) {
      // will replace the console.log with a logger when we have one
      console.log("Error while querying timetable: ", err.message);

      res.status(500).json({ message: "Internal Server Error" });
    }

    if (!timetable) {
      return res.status(404).json({ message: "timetable not found" });
    }

    if (timetable.authorId !== author.id) {
      return res.status(403).json({ message: "user does not own timetable" });
    }

    let section: Section | null = null;

    try {
      section = await sectionRepository
        .createQueryBuilder("section")
        .where("section.id = :sectionId", { sectionId })
        .getOne();
    } catch (err: any) {
      // will replace the console.log with a logger when we have one
      console.log("Error while querying for section: ", err.message);

      res.status(500).json({ message: "Internal Server Error" });
    }

    if (section === null) {
      return res.status(404).json({ message: "Section not found" });
    }

    let timetableHasSection = false;

    for (let timetableSection of timetable.sections) {
      if (timetableSection.id === section.id) {
        timetableHasSection = true;
        break;
      }
    }

    if (!timetableHasSection) {
      return res.status(404).json({
        message: "Section not part of given timetable",
      });
    }

    let course: Course | null = null;
    const courseId = section.courseId;

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

    const sameCourseSections: Section[] = timetable.sections.filter(
      (currentSection) => {
        return currentSection.courseId === section?.courseId;
      }
    );

    // remove course's exam timings if no other sections of this course in TT
    if (sameCourseSections.length === 1) {
      timetable.examTimes = timetable.examTimes.filter((examTime) => {
        return examTime.split("|")[0] !== course?.code;
      });
    }

    let sectionTypes: SectionTypeList = [];

    try {
      const sectionTypeHolders = await sectionRepository
        .createQueryBuilder("section")
        .select("section.type")
        .where("section.courseId = :courseId", { courseId: courseId })
        .distinctOn(["section.type"])
        .getMany();
      sectionTypes = sectionTypeHolders.map((section) => section.type);
    } catch (err: any) {
      // will replace the console.log with a logger when we have one
      console.log(
        "Error while querying for course's section types: ",
        err.message
      );

      res.status(500).json({ message: "Internal Server Error" });
    }

    const classTimings = section.roomTime.map((time) => {
      return time.split(":")[1] + time.split(":")[2];
    });

    timetable.timings = timetable.timings.filter((time) => {
      return !classTimings.includes(time.split(":")[1]);
    });

    timetable.sections = timetable.sections.filter((currentSection) => {
      return currentSection.id !== section?.id;
    });

    timetable.warnings = updateSectionWarnings(
      course.code,
      section,
      sectionTypes,
      false,
      timetable.warnings
    );

    try {
      await timetableRepository.save(timetable);
    } catch (err: any) {
      // will replace the console.log with a logger when we have one
      console.log("Error while removing section from timetable: ", err.message);

      res.status(500).json({ message: "Internal Server Error" });
    }

    return res.json({ message: "section removed" });
  } catch (err: any) {
    throw err;
  }
};
