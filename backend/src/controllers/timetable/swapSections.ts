import type { Request, Response } from "express";
import { namedUUIDType, type sectionTypeList, timetableIDType } from "lib";
import { z } from "zod";
import {
  type Course,
  type Section,
  Timetable,
  type User,
} from "../../entity/entities.js";
import { validate } from "../../middleware/zodValidateRequest.js";
import { courseRepository } from "../../repositories/courseRepository.js";
import { sectionRepository } from "../../repositories/sectionRepository.js";
import { timetableRepository } from "../../repositories/timetableRepository.js";
import { userRepository } from "../../repositories/userRepository.js";
import {
  checkForClassHoursClash,
  checkForExamHoursClash,
} from "../../utils/checkForClashes.js";
import sqids, { validSqid } from "../../utils/sqids.js";
import { updateSectionWarnings } from "../../utils/updateWarnings.js";

const dataSchema = z.object({
  body: z.object({
    sectionId: namedUUIDType("section"),
    newSectionId: namedUUIDType("new section"),
  }),
  params: z.object({
    id: timetableIDType,
  }),
});

export const swapSectionsValidator = validate(dataSchema);

export const swapSections = async (req: Request, res: Response) => {
  const logger = req.log;
  const dbID = sqids.decode(req.params.id as string);
  if (!validSqid(dbID)) {
    return res.status(404).json({ message: "Timetable does not exist" });
  }
  const sectionId = req.body.sectionId;
  const newSectionId = req.body.newSectionId;

  // Common checks

  let author: User | null = null;

  try {
    author = await userRepository
      .createQueryBuilder("user")
      .where("user.id = :id", { id: req.session?.id })
      .getOne();
  } catch (err: any) {
    logger.error("Error while querying user: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }

  if (!author) {
    return res.status(401).json({ message: "unregistered user" });
  }

  let timetable: Timetable | null = null;

  try {
    timetable = await timetableRepository
      .createQueryBuilder("timetable")
      .leftJoinAndSelect("timetable.sections", "section")
      .where("timetable.id = :id", { id: dbID[0] })
      .getOne();
  } catch (err: any) {
    logger.error("Error while querying timetable: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }

  if (!timetable) {
    return res.status(404).json({ message: "timetable not found" });
  }

  if (timetable.authorId !== author.id) {
    return res.status(403).json({ message: "user does not own timetable" });
  }

  if (!timetable.draft) {
    return res.status(418).json({ message: "timetable is not a draft" });
  }

  if (timetable.archived) {
    return res.status(418).json({ message: "timetable is archived" });
  }

  // Checks that removeSection makes

  let section: Section | null = null;

  try {
    section = await sectionRepository
      .createQueryBuilder("section")
      .where("section.id = :sectionId", { sectionId })
      .getOne();
  } catch (err: any) {
    logger.error("Error while querying for section: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }

  if (section === null) {
    return res.status(404).json({ message: "Section not found" });
  }

  let timetableHasSection = false;

  for (const timetableSection of timetable.sections) {
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

  // Checks that addSection makes

  let newSection: Section | null = null;

  try {
    newSection = await sectionRepository
      .createQueryBuilder("section")
      .where("section.id = :newSectionId", { newSectionId })
      .getOne();
  } catch (err: any) {
    logger.error("Error while querying for new section: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }

  if (newSection === null) {
    return res.status(404).json({ message: "New section not found" });
  }

  let course: Course | null = null;
  let newCourse: Course | null = null;

  try {
    course = await courseRepository
      .createQueryBuilder("course")
      .where("course.id = :id", { id: section.courseId })
      .getOne();
    newCourse = await courseRepository
      .createQueryBuilder("course")
      .where("course.id = :id", { id: newSection.courseId })
      .getOne();
  } catch (err: any) {
    logger.error("Error while querying for course: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }

  if (!course || !newCourse) {
    return res.status(404).json({ message: "course not found" });
  }

  if (course.archived || newCourse.archived) {
    return res.status(418).json({ message: "course is archived" });
  }

  let sectionTypes: sectionTypeList = [];
  let newSectionTypes: sectionTypeList = [];

  try {
    const sectionTypeHolders = await sectionRepository
      .createQueryBuilder("section")
      .select("section.type")
      .where("section.courseId = :courseId", { courseId: course.id })
      .distinctOn(["section.type"])
      .getMany();
    sectionTypes = sectionTypeHolders.map((section) => section.type);

    const newSectionTypeHolders = await sectionRepository
      .createQueryBuilder("section")
      .select("section.type")
      .where("section.courseId = :courseId", { courseId: newCourse.id })
      .distinctOn(["section.type"])
      .getMany();
    newSectionTypes = newSectionTypeHolders.map((section) => section.type);
  } catch (err: any) {
    logger.error(
      "Error while querying for courses' section types: ",
      err.message,
    );

    return res.status(500).json({ message: "Internal Server Error" });
  }

  // Here we update the state of the timetable in-memory and see if it violates any of our clash rules

  const sameCourseSections: Section[] = timetable.sections.filter(
    (currentSection) => {
      return currentSection.courseId === section?.courseId;
    },
  );

  // remove course's exam timings if no other sections of this course in TT
  if (sameCourseSections.length === 1) {
    timetable.examTimes = timetable.examTimes.filter((examTime) => {
      return examTime.split("|")[0] !== course?.code;
    });
  }

  const classTimings = section.roomTime.map((time) => {
    return time.split(":")[2] + time.split(":")[3];
  });

  timetable.timings = timetable.timings.filter((time) => {
    return !classTimings.includes(time.split(":")[1]);
  });

  timetable.sections = timetable.sections.filter((currentSection) => {
    return currentSection.id !== section?.id;
  });

  try {
    timetable.warnings = updateSectionWarnings(
      course.code,
      section,
      sectionTypes,
      false,
      timetable.warnings,
    );
  } catch (_err: any) {
    logger.error(
      `user with id ${author.id} tried to remove section ${section.type}${section.number} of course ${course.code} but it isn't part of their timetable according to warnings`,
    );

    return res.status(500).json({
      message:
        "Timetable and warnings state inconsistent, please contact us if you see this",
    });
  }

  const classHourClashes = checkForClassHoursClash(timetable, newSection);
  if (classHourClashes.clash) {
    return res.status(400).json({
      message: `section clashes with ${classHourClashes.course}`,
    });
  }

  const examHourClashes = checkForExamHoursClash(timetable, newCourse);
  if (examHourClashes.clash && !examHourClashes.sameCourse) {
    return res.status(400).json({
      message: `course's exam clashes with ${examHourClashes.course}'s ${examHourClashes.exam}`,
    });
  }

  const sameNewCourseTypeSectionsCount = timetable.sections.filter(
    (currentSection) => {
      return (
        currentSection.courseId === newSection?.courseId &&
        currentSection.type === newSection?.type
      );
    },
  ).length;

  if (sameNewCourseTypeSectionsCount > 0) {
    return res.status(400).json({
      message: `can't have multiple sections of type ${newSection.type}`,
    });
  }

  timetable.warnings = updateSectionWarnings(
    newCourse.code,
    newSection,
    newSectionTypes,
    true,
    timetable.warnings,
  );

  const newTimes: string[] = newSection.roomTime.map(
    (time) => `${newCourse?.code}:${time.split(":")[2]}${time.split(":")[3]}`,
  );

  const newExamTimes = timetable.examTimes;
  if (newCourse.midsemStartTime !== null && newCourse.midsemEndTime !== null) {
    newExamTimes.push(
      `${
        newCourse.code
      }|MIDSEM|${newCourse.midsemStartTime.toISOString()}|${newCourse.midsemEndTime.toISOString()}`,
    );
  }
  if (newCourse.compreStartTime !== null && newCourse.compreEndTime !== null) {
    newExamTimes.push(
      `${
        newCourse.code
      }|COMPRE|${newCourse.compreStartTime.toISOString()}|${newCourse.compreEndTime.toISOString()}`,
    );
  }

  // Finally once we have decided that the swap is valid we write to db in a safe transaction
  try {
    await timetableRepository.manager.transaction(
      async (transactionalEntityManager) => {
        if (!timetable) {
          return res.status(404).json({ message: "timetable not found" });
        }

        await transactionalEntityManager
          .createQueryBuilder()
          .relation(Timetable, "sections")
          .of(timetable)
          .remove(section);

        await transactionalEntityManager
          .createQueryBuilder()
          .relation(Timetable, "sections")
          .of(timetable)
          .add(newSection);

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
              examTimes: newExamTimes,
            })
            .where("timetable.id = :id", { id: timetable.id })
            .execute();
        }
      },
    );
  } catch (err: any) {
    logger.error("Error while swapping sections: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }
  return res.json({ message: "section swapped" });
};
