import { z } from "zod";
import {
  addNameToString,
  namedBooleanType,
  namedCollegeYearType,
  namedEmailType,
  namedISOTimestampType,
  namedIntegerType,
  namedNonEmptyStringType,
  namedSemesterType,
  namedTimetableIDType,
  namedUUIDType,
  namedYearType,
} from "../types/zodFieldTypes";
import { NamedDegreeZodList } from "../types/degrees";
import { NamedSectionTypeZodEnum } from "../types/sectionTypes";

export const namedCourseType = (name?: string) =>
  z
    .object({
      id: namedUUIDType(addNameToString("course", name)),
      code: namedNonEmptyStringType(addNameToString("course code", name)),
      name: namedNonEmptyStringType(addNameToString("course name", name)),
      midsemStartTime: namedISOTimestampType(
        addNameToString("course midsemStartTime", name)
      ),
      midsemEndTime: namedISOTimestampType(
        addNameToString("course midsemEndTime", name)
      ),
      compreStartTime: namedISOTimestampType(
        addNameToString("course compreStartTime", name)
      ),
      compreEndTime: namedISOTimestampType(
        addNameToString("course compreEndTime", name)
      ),
      archived: namedBooleanType(addNameToString("course archived", name)),
      acadYear: namedYearType(addNameToString("course acadYear", name)),
      semester: namedSemesterType(addNameToString("course", name)),
      createdAt: namedISOTimestampType(
        addNameToString("course createdAt", name)
      ),
    })
    .strict({ message: addNameToString("course has extra fields", name) });

export const namedSearchHistoryType = (name?: string) =>
  z
    .object({
      id: namedUUIDType(addNameToString("search history", name)),
      userEmailHash: namedNonEmptyStringType(
        addNameToString("search history user email hash", name)
      ),
      searchTerm: namedNonEmptyStringType(
        addNameToString("search history search term", name)
      ),
      searchedAt: namedISOTimestampType(
        addNameToString("search history searchedAt", name)
      ),
    })
    .strict({
      message: addNameToString("search history has extra fields", name),
    });

export const namedSectionType = (name?: string) =>
  z
    .object({
      id: namedUUIDType(addNameToString("section", name)),
      courseId: namedUUIDType(addNameToString("section courseId", name)),
      type: NamedSectionTypeZodEnum(addNameToString("section", name)),
      number: namedIntegerType(addNameToString("section number", name)),
      instructors: namedNonEmptyStringType(
        addNameToString("section instructors", name)
      ).array(),
      roomTime: namedNonEmptyStringType(
        addNameToString("section room-time", name)
      ).array(),
      createdAt: namedISOTimestampType(
        addNameToString("section createdAt", name)
      ),
    })
    .strict({ message: addNameToString("section has extra fields", name) });

export const namedTimetableType = (name?: string) =>
  z
    .object({
      id: namedTimetableIDType(addNameToString("timetable", name)),
      authorId: namedUUIDType(addNameToString("timetable authorId", name)),
      name: namedNonEmptyStringType(addNameToString("timetable name", name)),
      degrees: NamedDegreeZodList(addNameToString("timetable", name)),
      private: namedBooleanType(addNameToString("timetable private", name)),
      draft: namedBooleanType(addNameToString("timetable draft", name)),
      archived: namedBooleanType(addNameToString("timetable archived", name)),
      year: namedCollegeYearType(
        addNameToString("timetable college year", name)
      ),
      acadYear: namedYearType(addNameToString("timetable acadYear", name)),
      semester: namedSemesterType(addNameToString("timetable", name)),
      timings: namedNonEmptyStringType(
        addNameToString("timetable timings", name)
      ).array(),
      examTimes: namedNonEmptyStringType(
        addNameToString("timetable examTimes", name)
      ).array(),
      warnings: namedNonEmptyStringType(
        addNameToString("timetable warnings", name)
      ).array(),
      createdAt: namedISOTimestampType(
        addNameToString("timetable createdAt", name)
      ),
      lastUpdated: namedISOTimestampType(
        addNameToString("timetable lastUpdated", name)
      ),
    })
    .strict({ message: addNameToString("timtebale has extra fields", name) });

export const namedUserType = (name?: string) =>
  z
    .object({
      id: namedUUIDType(addNameToString("user", name)),
      email: namedEmailType(addNameToString("user", name)),
      batch: namedYearType(addNameToString("user batch", name)),
      name: namedNonEmptyStringType(addNameToString("user name", name)),
      degrees: NamedDegreeZodList(addNameToString("user", name)),
      createdAt: namedISOTimestampType(addNameToString("user createdAt", name)),
    })
    .strict({ message: addNameToString("user has extra fields", name) });

export const namedSectionWithCourseType = (name?: string) =>
  z
    .object({
      course: namedCourseType(addNameToString("section course", name)),
    })
    .merge(namedSectionType(name));

export const namedSectionWithTimetablesType = (name?: string) =>
  z
    .object({
      timetables: namedTimetableType(
        addNameToString("section timetables", name)
      ).array(),
    })
    .merge(namedSectionType(name));

export const namedSectionWithCourseAndTimetablesType = (name?: string) =>
  z
    .object({
      timetables: namedTimetableType(
        addNameToString("section timetables", name)
      ).array(),
    })
    .merge(namedSectionWithCourseType(name));

export const namedTimetableWithSectionsType = (name?: string) =>
  z
    .object({
      sections: namedSectionType(addNameToString("timetable sections", name))
        .array()
        .min(1, {
          message: addNameToString("timetable sections missing", name),
        }),
    })
    .merge(namedTimetableType(name));

export const namedUserWithTimetablesType = (name?: string) =>
  z
    .object({
      timetables: namedTimetableType(
        addNameToString("user timetables", name)
      ).array(),
    })
    .merge(namedUserType(name));

export const namedCourseWithSectionsType = (name?: string) =>
  z
    .object({
      sections: namedSectionType(addNameToString("course sections", name))
        .array()
        .min(1, { message: addNameToString("course sections missing", name) }),
    })
    .merge(namedCourseType(name));

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
