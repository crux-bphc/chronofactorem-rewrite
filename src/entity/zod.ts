import { z } from "zod";
import {
  addNameToString,
  namedBooleanType,
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
      id: namedUUIDType(name),
      code: namedNonEmptyStringType(addNameToString("code", name)),
      name: namedNonEmptyStringType(addNameToString("name", name)),
      midsemStartTime: namedISOTimestampType(
        addNameToString("midsemStartTime", name)
      ),
      midsemEndTime: namedISOTimestampType(
        addNameToString("midsemEndTime", name)
      ),
      compreStartTime: namedISOTimestampType(
        addNameToString("compreStartTime", name)
      ),
      compreEndTime: namedISOTimestampType(
        addNameToString("compreEndTime", name)
      ),
      archived: namedBooleanType(addNameToString("archived", name)),
      acadYear: namedYearType(addNameToString("acadYear", name)),
      semester: namedSemesterType(name),
      createdAt: namedISOTimestampType(addNameToString("createdAt", name)),
    })
    .strict({ message: addNameToString("has extra fields", name) });

export const namedSearchHistoryType = (name?: string) =>
  z
    .object({
      id: namedUUIDType(name),
      userEmailHash: namedNonEmptyStringType(
        addNameToString("user email hash", name)
      ),
      searchTerm: namedNonEmptyStringType(addNameToString("search term", name)),
      searchedAt: namedISOTimestampType(addNameToString("searchedAt", name)),
    })
    .strict({ message: addNameToString("has extra fields", name) });

export const namedSectionType = (name?: string) =>
  z
    .object({
      id: namedUUIDType(name),
      courseId: namedUUIDType(addNameToString("courseId", name)),
      type: NamedSectionTypeZodEnum(name),
      number: namedIntegerType(addNameToString("number", name)),
      instructors: namedNonEmptyStringType(
        addNameToString("instructors", name)
      ).array(),
      roomTime: namedNonEmptyStringType(
        addNameToString("room-time", name)
      ).array(),
      createdAt: namedISOTimestampType(addNameToString("createdAt", name)),
    })
    .strict({ message: addNameToString("has extra fields", name) });

export const namedTimetableType = (name?: string) =>
  z
    .object({
      id: namedTimetableIDType(name),
      authorId: namedUUIDType(addNameToString("authorId", name)),
      name: namedNonEmptyStringType(addNameToString("name", name)),
      degrees: NamedDegreeZodList(name),
      private: namedBooleanType(addNameToString("private", name)),
      draft: namedBooleanType(addNameToString("draft", name)),
      archived: namedBooleanType(addNameToString("archived", name)),
      year: namedYearType(addNameToString("year", name)),
      acadYear: namedYearType(addNameToString("acadYear", name)),
      semester: namedSemesterType(name),
      timings: namedNonEmptyStringType(addNameToString("timings", name)),
      examTimes: namedNonEmptyStringType(addNameToString("examTimes", name)),
      warnings: namedNonEmptyStringType(addNameToString("warnings", name)),
      createdAt: namedISOTimestampType(addNameToString("createdAt", name)),
      lastUpdated: namedISOTimestampType(addNameToString("lastUpdated", name)),
    })
    .strict({ message: addNameToString("has extra fields", name) });

export const namedUserType = (name?: string) =>
  z
    .object({
      id: namedUUIDType(name),
      email: namedEmailType(name),
      batch: namedYearType(addNameToString("batch", name)),
      name: namedNonEmptyStringType(addNameToString("name", name)),
      degrees: NamedDegreeZodList(name),
      createdAt: namedISOTimestampType(addNameToString("createdAt", name)),
    })
    .strict({ message: addNameToString("has extra fields", name) });

export const namedSectionWithCourseType = (name?: string) =>
  z
    .object({
      course: namedCourseType(addNameToString("course", name)),
    })
    .merge(namedSectionType(name));

export const namedSectionWithTimetablesType = (name?: string) =>
  z
    .object({
      timetables: namedTimetableType(
        addNameToString("timetables", name)
      ).array(),
    })
    .merge(namedSectionType(name));

export const namedSectionWithCourseAndTimetablesType = (name?: string) =>
  z
    .object({
      timetables: namedTimetableType(
        addNameToString("timetables", name)
      ).array(),
    })
    .merge(namedSectionWithCourseType(name));

export const namedTimetableWithSectionsType = (name?: string) =>
  z
    .object({
      sections: namedSectionType(addNameToString("sections", name))
        .array()
        .min(1, { message: addNameToString("sections missing", name) }),
    })
    .merge(namedTimetableType(name));

export const namedUserWithTimetablesType = (name?: string) =>
  z
    .object({
      timetables: namedTimetableType(
        addNameToString("timetables", name)
      ).array(),
    })
    .merge(namedUserType(name));

export const namedCourseWithSectionsType = (name?: string) =>
  z
    .object({
      sections: namedSectionType(addNameToString("sections", name))
        .array()
        .min(1, { message: addNameToString("sections missing", name) }),
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
