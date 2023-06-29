import { Timetable } from "../entity/Timetable";
import { Section } from "../entity/Section";
import { Course } from "../entity/Course";

export const checkForClassHoursClash = (
  currentTimetable: Timetable,
  newSection: Section
) => {
  const times = currentTimetable.timings;
  const newRoomTimes = newSection.roomTime;

  const timesMap = new Map<string, { courseCode: string }>();

  times.forEach((time) => {
    const [course, slot] = time.split(":");
    timesMap.set(slot, { courseCode: course });
  });

  const newTimes = newRoomTimes.map((roomTime) => {
    const [_, day, hour] = roomTime.split(":");
    return day + hour;
  });

  newTimes.forEach((newTime) => {
    if (timesMap.has(newTime)) {
      const clashCheck = timesMap.get(newTime);
      if (!clashCheck) {
        throw new Error("Error while checking for clashes");
      }
      const clashCourse = clashCheck.courseCode;
      return {
        clash: true,
        clashCourse,
      };
    }
  });

  return {
    clash: false,
  };
};
