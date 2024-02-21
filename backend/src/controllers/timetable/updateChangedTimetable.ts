import { Request, Response } from "express";
import { z } from "zod";
import {
  namedSectionWithCourseType,
  namedUUIDType,
  sectionWithCourseType,
} from "../../../../lib/src/index.js";

import { Course, Section, Timetable, User } from "../../entity/entities.js";
import { validate } from "../../middleware/zodValidateRequest.js";
import { courseRepository } from "../../repositories/courseRepository.js";
import { sectionRepository } from "../../repositories/sectionRepository.js";
import { timetableRepository } from "../../repositories/timetableRepository.js";

const dataSchema = z.object({
  body: z.object({
    course: sectionWithCourseType,
  }),
});

export const updateChangedTimetableValidator = validate(dataSchema);

export const updateChangedTimetable = async (req: Request, res: Response) => {
  try {
    const course: Course | null = req.body.course;
    console.log(course?.midsemStartTime);
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
        .where("id=:id", { id: course?.id })
        .execute();
    } catch (err: any) {
      console.log("Error while querying for course: ", err.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    const sections: Section[] = course?.sections || [];

    try {
      for (const section of sections) {
        await sectionRepository
          .createQueryBuilder()
          .update({ roomTime: section.roomTime })
          .where("section.id=:id", { id: section?.id })
          .andWhere("array_to_string(section.room_time, ',') != :newRoomTime", {
            newRoomTime: section.roomTime.join(","),
          })
          .execute();
      }
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
    if (!timetables) {
      return res.status(404).json({ message: "timetables not found" });
    }
    for (const timetable of timetables) {
      const currTimes = timetable.sections
        .flatMap((el: Section) => {
          return el.roomTime;
        })
        .map((el: string) => {
          return `${el.split(":")[0]}:${el.split(":")[2]}${el.split(":")[3]}`;
        });

      const isEqual: boolean =
        JSON.stringify(currTimes.sort()) ===
        JSON.stringify(timetable.timings.sort());
      if (!isEqual) {
        const difference = currTimes.filter(
          (el: string) => !timetable.timings.includes(el),
        );

        for (const sec of timetable.sections) {
          const exists =
            sec.roomTime
              .map((el: string) => {
                return `${el.split(":")[0]}:${el.split(":")[2]}${
                  el.split(":")[3]
                }`;
              })
              .filter((el) => {
                return difference.includes(el);
              }).length > 0;
          if (exists) {
            timetable.sections = timetable.sections.filter(
              (el) => el.id !== sec.id,
            );
          }
          await timetableRepository.save(timetable);
        }

        timetable.timings = timetable.sections
          .flatMap((el: Section) => {
            return el.roomTime;
          })
          .map((el: string) => {
            return `${el.split(":")[0]}:${el.split(":")[2]}${el.split(":")[3]}`;
          })
          .sort();

        try {
          await timetableRepository.save(timetable);
        } catch (err: any) {
          console.log(
            "Error while removing section from timetable: ",
            err.message,
          );
          return res.status(500).json({ message: "Internal Server Error" });
        }
      }
    }
    return res.json({ message: "Timetable successfully updated", timetables });
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
