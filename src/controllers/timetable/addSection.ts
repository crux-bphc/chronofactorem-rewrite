import { Request, Response } from "express";
import { timetableRepository } from "../../repositories/timetableRepository";
import { Timetable } from "../../entity/Timetable";
import { z } from "zod";
import { validate } from "../../utils/zodValidateRequest";
import { Section } from "../../entity/Section";
import { User } from "../../entity/User";
import { userRepository } from "../../repositories/userRepository";
import { sectionTypeList } from "../../types/sectionTypes";
import { sectionRepository } from "../../repositories/sectionRepository";
import {
  checkForClassHoursClash,
  checkForExamHoursClash,
} from "../../utils/checkForClashes";
import { Course } from "../../entity/Course";
import { courseRepository } from "../../repositories/courseRepository";
import { updateSectionWarnings } from "../../utils/updateWarnings";
import {
  namedEmailType,
  namedUUIDType,
  timetableIDType,
} from "../../types/zodFieldTypes";

const dataSchema = z.object({
  body: z.object({
    // auth temp replacement
    email: namedEmailType("user"),
    sectionId: namedUUIDType("section"),
  }),
  params: z.object({
    id: timetableIDType,
  }),
});

export const addSectionValidator = validate(dataSchema);

export const addSection = async (req: Request, res: Response) => {
  const timetableId = parseInt(req.params.id);
  const sectionId = req.body.sectionId;
  const email = req.body.email;

  let author: User | null = null;

  try {
    author = await userRepository
      .createQueryBuilder("user")
      .where("user.email = :email", { email: email })
      .getOne();
  } catch (err: any) {
    // will replace the console.log with a logger when we have one
    console.log("Error while querying user: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }

  if (!author) {
    return res.status(401).json({ message: "unregistered user" });
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

    return res.status(500).json({ message: "Internal Server Error" });
  }

  if (!timetable) {
    return res.status(404).json({ message: "timetable not found" });
  }

  if (timetable.authorId !== author.id) {
    return res.status(403).json({ message: "user does not own timetable" });
  }

  if (!timetable.draft) {
    return res.status(403).json({ message: "timetable is not a draft" });
  }

  let section: Section | null = null;

  try {
    section = await sectionRepository
      .createQueryBuilder("section")
      .where("section.id = :id", { id: sectionId })
      .getOne();
  } catch (err: any) {
    // will replace the console.log with a logger when we have one
    console.log("Error while querying for section: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }

  if (!section) {
    return res.status(404).json({ message: "section not found" });
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

    return res.status(500).json({ message: "Internal Server Error" });
  }

  if (!course) {
    return res.status(404).json({ message: "course not found" });
  }

  const classHourClashes = checkForClassHoursClash(timetable, section);
  if (classHourClashes.clash) {
    return res.status(400).json({
      message: `section clashes with ${classHourClashes.course}`,
    });
  }

  const examHourClashes = checkForExamHoursClash(timetable, course);
  if (examHourClashes.clash && !examHourClashes.sameCourse) {
    return res.status(400).json({
      message: `course's exam clashes with ${examHourClashes.course}'s ${examHourClashes.exam}`,
    });
  }

  let sectionTypes: sectionTypeList = [];

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

  let sameCourseSectionsCount = 0;

  try {
    sameCourseSectionsCount = await sectionRepository
      .createQueryBuilder("section")
      .innerJoin("section.timetables", "timetable")
      .where("timetable.id = :id", { id: timetable.id })
      .andWhere("section.courseId = :courseId", { courseId })
      .andWhere("section.type = :type", { type: section.type })
      .getCount();
  } catch (err: any) {
    // will replace the console.log with a logger when we have one
    console.log(
      "Error while querying for other sections of same course: ",
      err.message
    );

    res.status(500).json({ message: "Internal Server Error" });
  }

  if (sameCourseSectionsCount > 0) {
    return res.status(400).json({
      message: `can't have multiple sections of type ${section.type}`,
    });
  }

  timetable.warnings = updateSectionWarnings(
    course.code,
    section,
    sectionTypes,
    true,
    timetable.warnings
  );

  const newTimes: string[] = section.roomTime.map(
    (time) => course?.code + ":" + time.split(":")[1] + time.split(":")[2]
  );

  try {
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
          .relation(Timetable, "sections")
          .of(timetable)
          .add(section);

        await transactionalEntityManager
          .createQueryBuilder()
          .update(Timetable)
          .set({
            timings: [...timetable.timings, ...newTimes],
            warnings: timetable.warnings,
          })
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
            .where("timetable.id = :id", { id: timetable.id })
            .execute();
        }
      }
    );
  } catch (err: any) {
    // will replace the console.log with a logger when we have one
    console.log("Error while updating timetable with section: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }
  return res.json({ message: "section added" });
};
