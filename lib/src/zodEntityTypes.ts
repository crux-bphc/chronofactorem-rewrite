import { z } from "zod";
import { namedDegreeZodList } from "./degrees.js";
import { namedSectionTypeZodEnum } from "./sectionTypes.js";
import {
  addNameToString,
  namedBooleanType,
  namedCollegeYearType,
  namedEmailType,
  namedIntegerType,
  namedISOTimestampType,
  namedNonEmptyStringType,
  namedSemesterType,
  namedTimetableIDType,
  namedUUIDType,
  namedYearType,
} from "./zodFieldTypes.js";

export const namedCourseType = (name?: string) =>
  z.strictObject({
    id: namedUUIDType(addNameToString("course", name)),
    code: namedNonEmptyStringType(addNameToString("course code", name)),
    name: namedNonEmptyStringType(addNameToString("course name", name)),
    midsemStartTime: namedISOTimestampType(
      addNameToString("course midsemStartTime", name),
    ),
    midsemEndTime: namedISOTimestampType(
      addNameToString("course midsemEndTime", name),
    ),
    compreStartTime: namedISOTimestampType(
      addNameToString("course compreStartTime", name),
    ),
    compreEndTime: namedISOTimestampType(
      addNameToString("course compreEndTime", name),
    ),
    archived: namedBooleanType(addNameToString("course archived", name)),
    acadYear: namedYearType(addNameToString("course acadYear", name)),
    semester: namedSemesterType(addNameToString("course", name)),
    createdAt: namedISOTimestampType(addNameToString("course createdAt", name)),
  });

export const namedSearchHistoryType = (name?: string) =>
  z.strictObject({
    id: namedUUIDType(addNameToString("search history", name)),
    userEmailHash: namedNonEmptyStringType(
      addNameToString("search history user email hash", name),
    ),
    searchTerm: namedNonEmptyStringType(
      addNameToString("search history search term", name),
    ),
    searchedAt: namedISOTimestampType(
      addNameToString("search history searchedAt", name),
    ),
  });

export const namedSectionType = (name?: string) =>
  z.strictObject({
    id: namedUUIDType(addNameToString("section", name)),
    courseId: namedUUIDType(addNameToString("section courseId", name)),
    type: namedSectionTypeZodEnum(addNameToString("section", name)),
    number: namedIntegerType(addNameToString("section number", name)),
    instructors: namedNonEmptyStringType(
      addNameToString("section instructors", name),
    ).array(),
    roomTime: namedNonEmptyStringType(
      addNameToString("section room-time", name),
    ).array(),
    createdAt: namedISOTimestampType(
      addNameToString("section createdAt", name),
    ),
  });

export const namedTimetableType = (name?: string) =>
  z.strictObject({
    id: namedTimetableIDType(addNameToString("timetable", name)),
    authorId: namedUUIDType(addNameToString("timetable authorId", name)),
    name: namedNonEmptyStringType(addNameToString("timetable name", name)),
    degrees: namedDegreeZodList(addNameToString("timetable", name)),
    private: namedBooleanType(addNameToString("timetable private", name)),
    draft: namedBooleanType(addNameToString("timetable draft", name)),
    archived: namedBooleanType(addNameToString("timetable archived", name)),
    year: namedCollegeYearType(addNameToString("timetable college year", name)),
    acadYear: namedYearType(addNameToString("timetable acadYear", name)),
    semester: namedSemesterType(addNameToString("timetable", name)),
    timings: namedNonEmptyStringType(
      addNameToString("timetable timings", name),
    ).array(),
    examTimes: namedNonEmptyStringType(
      addNameToString("timetable examTimes", name),
    ).array(),
    warnings: namedNonEmptyStringType(
      addNameToString("timetable warnings", name),
    ).array(),
    createdAt: namedISOTimestampType(
      addNameToString("timetable createdAt", name),
    ),
    lastUpdated: namedISOTimestampType(
      addNameToString("timetable lastUpdated", name),
    ),
  });

export const namedUserType = (name?: string) =>
  z.strictObject({
    id: namedUUIDType(addNameToString("user", name)),
    email: namedEmailType(addNameToString("user", name)),
    batch: namedYearType(addNameToString("user batch", name)),
    name: namedNonEmptyStringType(addNameToString("user name", name)),
    degrees: namedDegreeZodList(addNameToString("user", name)),
    createdAt: namedISOTimestampType(addNameToString("user createdAt", name)),
  });

export const namedSectionWithCourseType = (name?: string) =>
  z
    .object({
      course: namedCourseType(addNameToString("section course", name)),
    })
    .extend(namedSectionType(name).shape);

export const namedSectionWithTimetablesType = (name?: string) =>
  z
    .object({
      timetables: namedTimetableType(
        addNameToString("section timetables", name),
      ).array(),
    })
    .extend(namedSectionType(name).shape);

export const namedSectionWithCourseAndTimetablesType = (name?: string) =>
  z
    .object({
      timetables: namedTimetableType(
        addNameToString("section timetables", name),
      ).array(),
    })
    .extend(namedSectionWithCourseType(name).shape);

export const namedTimetableWithSectionsType = (name?: string) =>
  z
    .object({
      sections: namedSectionType(addNameToString("timetable sections", name))
        .array()
        .min(1, {
          message: addNameToString("timetable sections missing", name),
        }),
    })
    .extend(namedTimetableType(name).shape);

export const namedUserWithTimetablesType = (name?: string) =>
  z
    .object({
      timetables: namedTimetableType(
        addNameToString("user timetables", name),
      ).array(),
    })
    .extend(namedUserType(name).shape);

export const namedCourseWithSectionsType = (name?: string) =>
  z
    .object({
      sections: namedSectionType(addNameToString("course sections", name))
        .array()
        .min(1, { message: addNameToString("course sections missing", name) }),
    })
    .extend(namedCourseType(name).shape);

export const namedAnnouncementType = (name?: string) =>
  z.strictObject({
    title: namedNonEmptyStringType(addNameToString("announcement title", name)),
    message: namedNonEmptyStringType(
      addNameToString("announcement message", name),
    ),
    createdAt: namedISOTimestampType(
      addNameToString("announcement createdAt", name),
    ).optional(),
  });

export const namedAnnouncementWithIDType = (name?: string) =>
  z.strictObject({
    id: namedUUIDType(addNameToString("announcement id", name)),
    title: namedNonEmptyStringType(addNameToString("announcement title", name)),
    message: namedNonEmptyStringType(
      addNameToString("announcement message", name),
    ),
    createdAt: namedISOTimestampType(
      addNameToString("announcement createdAt", name),
    ).optional(),
  });

export const announcementWithIDType = namedAnnouncementWithIDType();
export const announcementType = namedAnnouncementType();
export const userType = namedUserType();
export const timetableType = namedTimetableType();
export const sectionType = namedSectionType();
export const courseType = namedCourseType();
export const searchHistoryType = namedSearchHistoryType();

export const courseWithSectionsType = namedCourseWithSectionsType();

export const sectionWithCourseType = namedSectionWithCourseType();
export const sectionWithTimetablesType = namedSectionWithTimetablesType();
export const sectionWithCourseAndTimetablesType =
  namedSectionWithCourseAndTimetablesType();

export const timetableWithSectionsType = namedTimetableWithSectionsType();

export const userWithTimetablesType = namedUserWithTimetablesType();
