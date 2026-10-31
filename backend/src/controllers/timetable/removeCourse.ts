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
import { removeSection as removeSectionFromTimetable } from "../../utils/updateSection.js";
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
    courseId: namedUUIDType("course"),
  }),
  params: z.object({
    id: timetableIDType,
  }),
});

export const removeCourseValidator = validate(dataSchema);

// same end state as removing each section in turn, in one transaction
export const removeCourse = async (req: Request, res: Response) => {
  const logger = req.log;
  const dbID = decodeTimetableSqidOr404(req, res);
  if (dbID === null) {
    return;
  }
  const courseId = req.body.courseId;

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

  const courseSections = timetable.sections.filter(
    (section) => section.courseId === courseId,
  );

  if (courseSections.length === 0) {
    return res.status(404).json({
      message: "Course not part of given timetable",
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

  timetable.examTimes = timetable.examTimes.filter((examTime) => {
    return examTime.split("|")[0] !== course.code;
  });

  for (const section of courseSections) {
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
  }

  const removed = await queryOr500(
    res,
    logger,
    "Error while removing course from timetable: ",
    async () => {
      await timetableRepository.manager.transaction(
        async (transactionalEntityManager) => {
          await transactionalEntityManager
            .createQueryBuilder()
            .relation(Timetable, "sections")
            .of(timetable)
            .remove(courseSections);

          await transactionalEntityManager
            .createQueryBuilder()
            .update(Timetable)
            .set({
              timings: timetable.timings,
              examTimes: timetable.examTimes,
              warnings: timetable.warnings,
            })
            .where("timetable.id = :id", { id: timetable.id })
            .execute();
        },
      );
      return true;
    },
  );
  if (removed === undefined) {
    return;
  }

  return res.json({
    message: "course removed",
    sectionIds: courseSections.map((section) => section.id),
  });
};
