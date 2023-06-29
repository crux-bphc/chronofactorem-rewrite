import { Timetable } from "../entity/Timetable";
import { Section } from "../entity/Section";
import { Course } from "../entity/Course";

export const checkForClassHoursClash = (
  currentTimetable: Timetable,
  newSection: Section
) => {
  const times = currentTimetable.timings;
  const newRoomTimes = newSection.roomTime;

  const newTimes = newRoomTimes.map((roomTime) => {
    const [_, day, hour] = roomTime.split(":");
    return day + hour;
  });

  const clashes = newTimes.filter((newTime) => {
    times.includes(newTime);
  });

  return clashes.length > 0;
};

export const checkForExamHoursClash = (
  currentTimetable: Timetable,
  newCourse: Course
) => {
  const midsemTimes = currentTimetable.midsemTimes;
  const compreTimes = currentTimetable.compreTimes;

  const newMidsemTime = newCourse.midsemTime;
  const newCompreTime = newCourse.compreTime;

  const midsemClash = midsemTimes.includes(newMidsemTime);
  const compreClash = compreTimes.includes(newCompreTime);

  return midsemClash || compreClash;
};
