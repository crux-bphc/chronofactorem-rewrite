import { Course, Timetable } from "../entity/entities.js";

export const checkForExamTimingsChange = (
  timetable: Timetable,
  course: Course,
) => {
  const midsemTimes = timetable.examTimes.filter((examTime) => {
    return (
      examTime?.split("|")[0] === course?.code &&
      examTime?.split("|")[1] === "MIDSEM"
    );
  })[0];

  const compreTimes = timetable.examTimes.filter((examTime) => {
    return (
      examTime?.split("|")[0] === course?.code &&
      examTime?.split("|")[1] === "COMPRE"
    );
  })[0];

  if (
    midsemTimes?.split("|")[2] !== `${course.midsemStartTime}` ||
    midsemTimes?.split("|")[3] !== `${course.midsemEndTime}`
  ) {
    return true;
  }
  if (
    compreTimes?.split("|")[2] !== `${course.compreStartTime}` ||
    compreTimes?.split("|")[3] !== `${course.compreEndTime}`
  ) {
    return true;
  }

  return false;
};
