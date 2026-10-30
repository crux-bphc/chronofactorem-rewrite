import { getClashingExamTimes } from "lib";
import type { Course, Section, Timetable } from "../entity/entities.js";

export const checkForClassHoursClash = (
  timetable: Timetable,
  newSection: Section,
) => {
  const times = timetable.timings;
  const newRoomTimes = newSection.roomTime;

  const timesMap = new Map<string, { courseCode: string }>();

  for (const time of times) {
    const [course, slot] = time.split(":");
    timesMap.set(slot, { courseCode: course });
  }

  const newTimes = newRoomTimes.map((roomTime) => {
    const [_, __, day, hour] = roomTime.split(":");
    return day + hour;
  });

  for (const newTime of newTimes) {
    const clashCheck = timesMap.get(newTime);
    if (clashCheck !== undefined) {
      const clashCourse = clashCheck.courseCode;
      return {
        clash: true,
        course: clashCourse,
      };
    }
  }

  return {
    clash: false,
    course: null,
  };
};

export const checkForExamHoursClash = (
  timetable: Timetable,
  newCourse: Course,
) => {
  if (
    timetable.examTimes.some((time) => time.split("|")[0] === newCourse.code)
  ) {
    return { clash: false, exam: "", course: "", sameCourse: true };
  }
  for (const exam of ["midsem", "compre"] as const) {
    const course = {
      ...newCourse,
      midsemStartTime: exam === "midsem" ? newCourse.midsemStartTime : null,
      midsemEndTime: exam === "midsem" ? newCourse.midsemEndTime : null,
      compreStartTime: exam === "compre" ? newCourse.compreStartTime : null,
      compreEndTime: exam === "compre" ? newCourse.compreEndTime : null,
    };
    const clashes = getClashingExamTimes(course, timetable.examTimes);
    if (clashes)
      return {
        clash: true,
        exam,
        course: clashes[0].split("|")[0],
        sameCourse: false,
      };
  }
  return { clash: false, exam: "", course: "", sameCourse: false };
};
