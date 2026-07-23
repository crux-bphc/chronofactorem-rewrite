import type { Request, Response } from "express";
import { namedUUIDType, timetableIDType } from "lib";
import { z } from "zod";
import { type Section, Timetable } from "../../entity/entities.js";
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
import {
  addExamTimings,
  removeSection as removeSectionFromTimetable,
} from "../../utils/updateSection.js";
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
    newSectionId: namedUUIDType("new section"),
  }),
  params: z.object({
    id: timetableIDType,
  }),
});

export const swapSectionsValidator = validate(dataSchema);

export const swapSections = async (req: Request, res: Response) => {
  const logger = req.log;
  const dbID = decodeTimetableSqidOr404(req, res);
  if (dbID === null) {
    return;
  }
  const sectionId = req.body.sectionId;
  const newSectionId = req.body.newSectionId;

  // Common checks

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

  // Checks that removeSection makes

  const section = await queryOr500(
    res,
    logger,
    "Error while querying for section: ",
    () =>
      sectionRepository
        .createQueryBuilder("section")
        .where("section.id = :sectionId", { sectionId })
        .getOne(),
  );
  if (section === undefined) {
    return;
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

  const newSection = await queryOr500(
    res,
    logger,
    "Error while querying for new section: ",
    () =>
      sectionRepository
        .createQueryBuilder("section")
        .where("section.id = :newSectionId", { newSectionId })
        .getOne(),
  );
  if (newSection === undefined) {
    return;
  }

  if (newSection === null) {
    return res.status(404).json({ message: "New section not found" });
  }

  const course = await queryOr500(
    res,
    logger,
    "Error while querying for course: ",
    () =>
      courseRepository
        .createQueryBuilder("course")
        .where("course.id = :id", { id: section.courseId })
        .getOne(),
  );
  if (course === undefined) {
    return;
  }

  const newCourse = await queryOr500(
    res,
    logger,
    "Error while querying for course: ",
    () =>
      courseRepository
        .createQueryBuilder("course")
        .where("course.id = :id", { id: newSection.courseId })
        .getOne(),
  );
  if (newCourse === undefined) {
    return;
  }

  if (!course || !newCourse) {
    return res.status(404).json({ message: "course not found" });
  }

  if (course.archived || newCourse.archived) {
    return res.status(418).json({ message: "course is archived" });
  }

  const sectionTypes = await queryOr500(
    res,
    logger,
    "Error while querying for courses' section types: ",
    () => getCourseSectionTypes(sectionRepository.manager, course.id),
  );
  if (sectionTypes === undefined) {
    return;
  }

  const newSectionTypes = await queryOr500(
    res,
    logger,
    "Error while querying for courses' section types: ",
    () => getCourseSectionTypes(sectionRepository.manager, newCourse.id),
  );
  if (newSectionTypes === undefined) {
    return;
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

  removeSectionFromTimetable(timetable, section);

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
  addExamTimings(newExamTimes, newCourse);

  // Finally once we have decided that the swap is valid we write to db in a safe transaction
  const swapped = await queryOr500(
    res,
    logger,
    "Error while swapping sections: ",
    async () => {
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
      return true;
    },
  );
  if (swapped === undefined) {
    return;
  }
  return res.json({ message: "section swapped" });
};
