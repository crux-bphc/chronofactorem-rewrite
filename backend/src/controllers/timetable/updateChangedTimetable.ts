import type { Request, Response } from "express";
import { Course, Timetable } from "../../entity/entities.js";
import { z } from "zod";
import { courseWithSectionsType } from "../../../../lib/src/index.js";
import { validate } from "../../middleware/zodValidateRequest.js";
import { courseRepository } from "../../repositories/courseRepository.js";
import { sectionRepository } from "../../repositories/sectionRepository.js";
import { timetableRepository } from "../../repositories/timetableRepository.js";
import { checkForExamTimingsChange } from "../../utils/checkForChange.js";
import {
  checkForClassHoursClash,
  checkForExamHoursClash,
} from "../../utils/checkForClashes.js";
import {
  addExamTimings,
  removeCourseExams,
  removeSection,
} from "../../utils/updateSection.js";

const dataSchema = z.object({
  body: z.object({
    course: courseWithSectionsType,
  }),
});

export const updateChangedTimetableValidator = validate(dataSchema);

export const updateChangedTimetable = async (req: Request, res: Response) => {
  try {
    const course: Course = req.body.course;
    try {
      await courseRepository
        .createQueryBuilder()
        .update(Course)
        .set({
          midsemStartTime: course?.midsemStartTime,
          midsemEndTime: course?.midsemEndTime,
          compreStartTime: course?.compreStartTime,
          compreEndTime: course?.compreEndTime,
        })
        .where("id = :id", { id: course?.id })
        .execute();
    } catch (err: any) {
      console.log("Error while querying for course: ", err.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    let timetables: Timetable[] | null = null;

    try {
      timetables = await timetableRepository
        .createQueryBuilder("timetable")
        .leftJoinAndSelect("timetable.sections", "section")
        .getMany();
    } catch (err: any) {
      console.log("Error while querying for timetable: ", err.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    for (const timetable of timetables) {
      if (checkForExamTimingsChange(timetable, course)) {
        timetable.examTimes = timetable.examTimes.filter((examTime) => {
          return examTime.split("|")[0] !== course?.code;
        });

        if (checkForExamHoursClash(timetable, course).clash) {
          for (const sec of timetable.sections) {
            if (sec.courseId === course.id) {
              removeSection(timetable, sec);
              timetable.draft = true;
            }
          }
          await timetableRepository.save(timetable);
        } else {
          const newExamTimes = timetable.examTimes;
          addExamTimings(newExamTimes, course);
          timetable.examTimes = newExamTimes;
        }
      }
      for (const section of timetable.sections) {
        const newSection = course.sections.find((el) => el.id === section.id);

        if (newSection !== undefined) {
          removeSection(timetable, section);

          await timetableRepository
            .createQueryBuilder()
            .relation(Timetable, "sections")
            .of(timetable)
            .remove(section);

          if (checkForClassHoursClash(timetable, newSection).clash) {
            timetable.draft = true;
          } else {
            const newTimes: string[] = newSection.roomTime.map(
              (time) =>
                `${course?.code}:${time.split(":")[2]}${time.split(":")[3]}`,
            );
            await sectionRepository
              .createQueryBuilder()
              .update({ roomTime: newSection.roomTime })
              .where("section.id = :id", { id: section?.id })
              .execute();
            await timetableRepository.manager.transaction(
              async (transactionEntityManager) => {
                await transactionEntityManager
                  .createQueryBuilder()
                  .relation(Timetable, "sections")
                  .of(timetable)
                  .add(newSection);
                await transactionEntityManager
                  .createQueryBuilder()
                  .update(Timetable)
                  .set({
                    timings: [...timetable.timings, ...newTimes],
                    warnings: timetable.warnings,
                  })
                  .where("timetable.id = :id", { id: timetable.id })
                  .execute();
              },
            );

            timetable.timings = [...timetable.timings, ...newTimes];
            timetable.sections = [...timetable.sections, newSection];
          }
        }
      }
      removeCourseExams(timetable, course);
      await timetableRepository.save(timetable);
    }
    try {
      for (const section of course.sections) {
        await sectionRepository
          .createQueryBuilder()
          .update({ roomTime: section.roomTime })
          .where("section.id=:id", { id: section?.id })
          .execute();
      }
    } catch (err: any) {
      console.log("Error while querying for course: ", err.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res.json({ message: "Timetable successfully updated" });
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
