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
      `${course.code}|MIDSEM|${course.midsemStartTime}|${course.midsemEndTime}`,
    );
  }
  if (course.compreStartTime !== null && course.compreEndTime !== null) {
    newExamTimes.push(
      `${course.code}|COMPRE|${course.compreStartTime}|${course.compreEndTime}`,
    );
  }
};

export const removeCourseExams = async (
  timetable: Timetable,
  course: Course,
) => {
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
};
