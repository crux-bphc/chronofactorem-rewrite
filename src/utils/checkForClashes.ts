import { Timetable } from "../entity/Timetable";
import { Section } from "../entity/Section";
import { Course } from "../entity/Course";

export const checkForClassHoursClash = (
  timetable: Timetable,
  newSection: Section
) => {
  const times = timetable.timings;
  const newRoomTimes = newSection.roomTime;

  const timesMap = new Map<string, { courseCode: string }>();

  for (const time of times) {
    const [course, slot] = time.split(":");
    timesMap.set(slot, { courseCode: course });
  }

  const newTimes = newRoomTimes.map((roomTime) => {
    const [_, day, hour] = roomTime.split(":");
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
  newCourse: Course
) => {
  const examTimes = timetable.examTimes;
  const courseCodes = new Set<string>();
  // key: start time, value: { courseCode, end time }
  const examTimesMap = new Map<Date, { courseCode: string; end: Date }>();
  for (const examTime of examTimes) {
    const [course, start, end] = examTime.split("|");
    courseCodes.add(course);
    examTimesMap.set(new Date(start), {
      courseCode: course,
      end: new Date(end),
    });
  }

  if (courseCodes.has(newCourse.code)) {
    return {
      clash: false,
      exam: "",
      course: "",
      sameCourse: true,
    };
  }

  const newMidsemStartTime = newCourse.midsemStartTime;
  const newMidsemEndTime = newCourse.midsemEndTime;

  for (const [key, value] of examTimesMap) {
    const { courseCode, end } = value;
    const start = key;
    if (
      (newMidsemStartTime <= start && newMidsemEndTime >= start) ||
      (newMidsemStartTime <= end && newMidsemEndTime >= end) ||
      (newMidsemStartTime >= start && newMidsemEndTime <= end)
    ) {
      return {
        clash: true,
        exam: "midsem",
        course: courseCode,
        sameCourse: false,
      };
    }
  }

  const newCompreStartTime = newCourse.compreStartTime;
  const newCompreEndTime = newCourse.compreEndTime;

  for (const [key, value] of examTimesMap) {
    const { courseCode, end } = value;
    const start = key;
    if (
      (newCompreStartTime <= start && newCompreEndTime >= start) ||
      (newCompreStartTime <= end && newCompreEndTime >= end) ||
      (newCompreStartTime >= start && newCompreEndTime <= end)
    ) {
      return {
        clash: true,
        exam: "compre",
        course: courseCode,
        sameCourse: false,
      };
    }
  }

  return {
    clash: false,
    exam: "",
    course: "",
    sameCourse: false,
  };
};
