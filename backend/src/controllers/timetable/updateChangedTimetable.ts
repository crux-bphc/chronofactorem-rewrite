import type { Request, Response } from "express";
import { Course, Timetable, Section } from "../../entity/entities.js";
import { z } from "zod";
import { courseWithSectionsType } from "../../../../lib/src/index.js";
import { validate } from "../../middleware/zodValidateRequest.js";
import { checkForExamTimingsChange } from "../../utils/checkForChange.js";
import {
  checkForClassHoursClash,
  checkForExamHoursClash,
} from "../../utils/checkForClashes.js";
import { addExamTimings, removeSection } from "../../utils/updateSection.js";
import { AppDataSource } from "../../db.js";

const dataSchema = z.object({
  body: z.object({
    course: courseWithSectionsType,
  }),
});

export const updateChangedTimetableValidator = validate(dataSchema);

export const updateChangedTimetable = async (req: Request, res: Response) => {
  try {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const course: Course = req.body.course;
    try {
      await queryRunner.manager
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
      timetables = await queryRunner.manager
        .createQueryBuilder(Timetable, "timetable")
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
            }
          }
          timetable.draft = true;
          timetable.private = true;
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

          await queryRunner.manager
            .createQueryBuilder()
            .relation(Timetable, "sections")
            .of(timetable)
            .remove(section);

          if (checkForClassHoursClash(timetable, newSection).clash) {
            timetable.draft = true;
            timetable.private = true;
          } else {
            const newTimes: string[] = newSection.roomTime.map(
              (time) =>
                `${course?.code}:${time.split(":")[2]}${time.split(":")[3]}`,
            );
            await queryRunner.manager
              .createQueryBuilder()
              .update(Section, { roomTime: newSection.roomTime })
              .where("section.id = :id", { id: section?.id })
              .execute();
            await queryRunner.manager
              .createQueryBuilder()
              .relation(Timetable, "sections")
              .of(timetable)
              .add(newSection);
            await queryRunner.manager
              .createQueryBuilder()
              .update(Timetable)
              .set({
                timings: [...timetable.timings, ...newTimes],
                warnings: timetable.warnings,
              })
              .where("timetable.id = :id", { id: timetable.id })
              .execute();

            timetable.timings = [...timetable.timings, ...newTimes];
            timetable.sections = [...timetable.sections, newSection];
          }
        }
      }
      const sameCourseSections: Section[] = timetable.sections.filter(
        (currentSection) => {
          return currentSection.courseId === course.id;
        },
      );
      if (sameCourseSections.length === 0) {
        timetable.examTimes = timetable.examTimes.filter((examTime) => {
          return examTime.split("|")[0] !== course?.code;
        });
      }
    }
    await queryRunner.manager.save(timetables);
    try {
      for (const section of course.sections) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(Section, { roomTime: section.roomTime })
          .where("section.id = :id", { id: section?.id })
          .execute();
      }
    } catch (err: any) {
      console.log("Error while querying for course: ", err.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    await queryRunner.commitTransaction();
    queryRunner.release();
    return res.json({ message: "Timetable successfully updated" });
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
