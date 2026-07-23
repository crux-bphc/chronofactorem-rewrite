import type { Request, Response } from "express";
import { namedUUIDType, timetableIDType } from "lib";
import { z } from "zod";
import { Timetable } from "../../entity/entities.js";
import { validate } from "../../middleware/zodValidateRequest.js";
import {
  courseRepository,
  sectionRepository,
  timetableRepository,
} from "../../repositories/index.js";
import {
  checkForClassHoursClash,
  checkForExamHoursClash,
} from "../../utils/checkForClashes.js";
import { addExamTimings } from "../../utils/updateSection.js";
import { updateSectionWarnings } from "../../utils/updateWarnings.js";
import {
  decodeTimetableSqidOr404,
  fetchAuthorOrError,
  fetchTimetableOrError,
  getCourseSectionTypes,
  queryOr500,
} from "./helpers.js";

const dataSchema = z.object({
  body: z.object({
    sectionId: namedUUIDType("section"),
  }),
  params: z.object({
    id: timetableIDType,
  }),
});

export const addSectionValidator = validate(dataSchema);

export const addSection = async (req: Request, res: Response) => {
  const logger = req.log;
  const dbID = decodeTimetableSqidOr404(req, res);
  if (dbID === null) {
    return;
  }

  const sectionId = req.body.sectionId;

  const author = await fetchAuthorOrError(
    req,
    res,
    logger,
    "Error while querying user: ",
  );
  if (!author) {
    return;
  }

  const timetable = await fetchTimetableOrError(res, logger, dbID, {
    authorId: author.id,
    joinSections: true,
    mustBeDraft: true,
    queryErrorLogMessage: "Error while querying timetable: ",
  });
  if (!timetable) {
    return;
  }

  const section = await queryOr500(
    res,
    logger,
    "Error while querying for section: ",
    () =>
      sectionRepository
        .createQueryBuilder("section")
        .where("section.id = :id", { id: sectionId })
        .getOne(),
  );
  if (section === undefined) {
    return;
  }

  if (!section) {
    return res.status(404).json({ message: "section not found" });
  }

  const courseId = section.courseId;

  const course = await queryOr500(
    res,
    logger,
    "Error while querying for course: ",
    () =>
      courseRepository
        .createQueryBuilder("course")
        .where("course.id = :id", { id: courseId })
        .getOne(),
  );
  if (course === undefined) {
    return;
  }

  if (!course) {
    return res.status(404).json({ message: "course not found" });
  }

  if (course.archived) {
    return res.status(418).json({ message: "course is archived" });
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

  const sectionTypes = await queryOr500(
    res,
    logger,
    "Error while querying for course's section types: ",
    () => getCourseSectionTypes(sectionRepository.manager, courseId),
  );
  if (sectionTypes === undefined) {
    return;
  }

  // the timetable's sections were already loaded with it above, so this
  // check happens in memory, same as in removeSection and swapSections
  const sameCourseSectionsCount = timetable.sections.filter(
    (currentSection) => {
      return (
        currentSection.courseId === courseId &&
        currentSection.type === section?.type
      );
    },
  ).length;

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
    timetable.warnings,
  );

  const newTimes: string[] = section.roomTime.map(
    (time) => `${course?.code}:${time.split(":")[2]}${time.split(":")[3]}`,
  );

  const newExamTimes = timetable.examTimes;
  addExamTimings(newExamTimes, course);

  const updated = await queryOr500(
    res,
    logger,
    "Error while updating timetable with section: ",
    async () => {
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
                examTimes: newExamTimes,
              })
              .where("timetable.id = :id", { id: timetable.id })
              .execute();
          }
        },
      );
      return true;
    },
  );
  if (updated === undefined) {
    return;
  }
  return res.json({ message: "section added" });
};
