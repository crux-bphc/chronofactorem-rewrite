import { Request, Response } from "express";
import { z } from "zod";
import {
  namedUUIDType,
  sectionTypeList,
  timetableIDType,
} from "../../../../lib/src/index.js";
import { Course, Section, Timetable, User } from "../../entity/entities.js";
import { validate } from "../../middleware/zodValidateRequest.js";
import { courseRepository } from "../../repositories/courseRepository.js";
import { sectionRepository } from "../../repositories/sectionRepository.js";
import { timetableRepository } from "../../repositories/timetableRepository.js";
import { userRepository } from "../../repositories/userRepository.js";
import sqids, { validSqid } from "../../utils/sqids.js";
import { updateSectionWarnings } from "../../utils/updateWarnings.js";

const dataSchema = z.object({
  body: z.object({
    sectionId: namedUUIDType("section"),
  }),
  params: z.object({
    id: timetableIDType,
  }),
});

export const removeSectionValidator = validate(dataSchema);

export const removeSection = async (req: Request, res: Response) => {
  const logger = req.log;
  const dbID = sqids.decode(req.params.id);
  if (!validSqid(dbID)) {
    return res.status(404).json({ message: "Timetable does not exist" });
  }
  const sectionId = req.body.sectionId;

  let author: User | null = null;

  try {
    author = await userRepository
      .createQueryBuilder("user")
      .where("user.id = :id", { id: req.session?.id })
      .getOne();
  } catch (err: any) {
    // will replace the logger.error with a logger when we have one
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
    // will replace the logger.error with a logger when we have one
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

  let section: Section | null = null;

  try {
    section = await sectionRepository
      .createQueryBuilder("section")
      .where("section.id = :sectionId", { sectionId })
      .getOne();
  } catch (err: any) {
    // will replace the logger.error with a logger when we have one
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

  let course: Course | null = null;
  const courseId = section.courseId;

  try {
    course = await courseRepository
      .createQueryBuilder("course")
      .where("course.id = :id", { id: courseId })
      .getOne();
  } catch (err: any) {
    // will replace the logger.error with a logger when we have one
    logger.error("Error while querying for course: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }

  if (!course) {
    return res.status(404).json({ message: "course not found" });
  }

  if (course.archived) {
    return res.status(418).json({ message: "course is archived" });
  }

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
    // will replace the logger.error with a logger when we have one
    logger.error(
      "Error while querying for course's section types: ",
      err.message,
    );

    return res.status(500).json({ message: "Internal Server Error" });
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
  } catch (err: any) {
    logger.error(
      `user with id ${author.id} tried to remove section ${section.type}${section.number} of course ${course.code} but it isn't part of their timetable according to warnings`,
    );

    return res.status(500).json({
      message:
        "Timetable and warnings state inconsistent, please contact us if you see this",
    });
  }

  try {
    await timetableRepository.save(timetable);
  } catch (err: any) {
    // will replace the logger.error with a logger when we have one
    logger.error("Error while removing section from timetable: ", err.message);

    return res.status(500).json({ message: "Internal Server Error" });
  }

  return res.json({ message: "section removed" });
};
