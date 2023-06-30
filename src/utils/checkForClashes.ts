import { Timetable } from "../entity/Timetable";
import { Section } from "../entity/Section";
import { Course } from "../entity/Course";
import { SectionTypeEnum, SectionTypeList } from "../types/sectionTypes";

export const checkForClassHoursClash = (
  currentTimetable: Timetable,
  newSection: Section
) => {
  const times = currentTimetable.timings;
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
    if (timesMap.has(newTime)) {
      const clashCheck = timesMap.get(newTime);
      if (clashCheck !== undefined) {
        const clashCourse = clashCheck.courseCode;
        return {
          clash: true,
          course: clashCourse,
        };
      }
    }
  }

  return {
    clash: false,
    course: null,
  };
};

export const checkForExamHoursClash = (
  currentTimetable: Timetable,
  newCourse: Course
) => {
  const examTimes = currentTimetable.examTimes;
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

export const updateSectionWarnings = (
  courseCode: string,
  section: Section,
  requiredSectionTypes: SectionTypeList,
  userSections: Section[],
  isAdded: boolean,
  warnings: string[]
) => {
  // Converting userSections to userSectionsMap
  const userSectionsMap = new Map<string, { type: SectionTypeEnum }>();
  for (const userSection of userSections) {
    const type = userSection.type;
    userSectionsMap.set(courseCode, { type });
  }
  // Converting warnings to warningMap
  const warningMap = new Map<
    string,
    { warningCourseSectionTypesSplit: string[] }
  >();
  for (const warning of warnings) {
    const [warningCourseCode, warningCourseSectionTypes] = warning.split("|");
    const warningCourseSectionTypesSplit = warningCourseSectionTypes.split("");
    warningMap.set(warningCourseCode, { warningCourseSectionTypesSplit });
  }

  const sectionType = section.type;
  let updatedWarnings: string[] = [];

  if (isAdded) {
    const currentWarning = warningMap.get(courseCode);
    if (!currentWarning) {
      // Since warning does not exist already, add a new warning
      const warningCourseSectionTypesList: string[] = [];
      for (const requiredSectionType of requiredSectionTypes) {
        if (requiredSectionType != sectionType) {
          warningCourseSectionTypesList.push(requiredSectionType);
        }
      }
      warningCourseSectionTypesList.sort();
      warningMap.set(courseCode, {
        warningCourseSectionTypesSplit: warningCourseSectionTypesList,
      });
    } else {
      // Deleting courseType from warnings after adding course
      for (const currentSectionWarning of currentWarning!
        .warningCourseSectionTypesSplit) {
        if (sectionType == currentSectionWarning) {
          const index = currentWarning!.warningCourseSectionTypesSplit.indexOf(
            currentSectionWarning
          );
          currentWarning!.warningCourseSectionTypesSplit.splice(index!, 1);
          if (currentWarning!.warningCourseSectionTypesSplit.length == 0) {
            warningMap.delete(courseCode);
          }
        }
      }
    }
  } else {
    const currentWarning = warningMap.get(courseCode);
    if (!currentWarning) {
      //No warnings currently exist, thus adding new one for this section
      warningMap.set(courseCode, {
        warningCourseSectionTypesSplit: [sectionType],
      });
    } else {
      const currentWarningCourseSectionTypesSplit =
        currentWarning.warningCourseSectionTypesSplit;
      if (sectionType in currentWarningCourseSectionTypesSplit) {
        throw Error("Removing a course that should not be there according to warnings");
      }
      //Adding new courseType to warnings after removing course
      if (sectionType in requiredSectionTypes) {
        currentWarningCourseSectionTypesSplit.push(sectionType);
        currentWarningCourseSectionTypesSplit.sort();
        warningMap.set(courseCode, {
          warningCourseSectionTypesSplit: currentWarningCourseSectionTypesSplit,
        });
      }
    }
  }
  // Regenerating warnings from warningMap.
  for (const currentWarning of warningMap) {
    let combinedWarningString = currentWarning[0];
    combinedWarningString.concat(":");
    for (const courseSectionType of currentWarning[1]
      .warningCourseSectionTypesSplit) {
      if (
        combinedWarningString.charAt(combinedWarningString.length - 1) == ":"
      ) {
        combinedWarningString.concat(courseSectionType);
      } else {
        combinedWarningString.concat("|");
        combinedWarningString.concat(courseSectionType);
      }
    }
    updatedWarnings.push(combinedWarningString);
  }
  updatedWarnings.sort();
  return updatedWarnings;
};
