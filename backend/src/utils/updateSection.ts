import { Course, Section, Timetable } from "../entity/entities.js";

export const removeSection = (timetable: Timetable, section: Section) => {
  const classTimings = section.roomTime.map((time) => {
    return time.split(":")[2] + time.split(":")[3];
  });

  timetable.timings = timetable.timings.filter((time) => {
    return !classTimings.includes(time.split(":")[1]);
  });
  timetable.sections = timetable.sections.filter((currentSection) => {
    return currentSection.id !== section?.id;
  });
};

export const addExamTimings = (newExamTimes: Array<string>, course: Course) => {
  if (course.midsemStartTime !== null && course.midsemEndTime !== null) {
    newExamTimes.push(
      `${
        course.code
      }|MIDSEM|${course.midsemStartTime.toISOString()}|${course.midsemEndTime.toISOString()}`,
    );
  }
  if (course.compreStartTime !== null && course.compreEndTime !== null) {
    newExamTimes.push(
      `${
        course.code
      }|COMPRE|${course.compreStartTime.toISOString()}|${course.compreEndTime.toISOString()}`,
    );
  }
};
