import { Timetable } from "../entity/Timetable";
import { Section } from "../entity/Section";

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
