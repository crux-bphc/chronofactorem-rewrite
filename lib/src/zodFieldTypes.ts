import { z } from "zod";

// !!! IMPORTANT: THIS IS THE SOURCE OF TRUTH FOR THESE TYPES
export const addNameToString = (string: string, name?: string) =>
  name ? `${name} ${string}` : string;

export const namedUUIDType = (name?: string) =>
  z.uuid({ message: addNameToString("id must be a valid uuid", name) }).min(1, {
    message: addNameToString("id must be a non-empty string", name),
  });

export const uuidType = namedUUIDType();

export const namedEmailType = (name?: string) =>
  z
    .email({
      message: addNameToString("email must be a valid email", name),
    })
    .min(1, {
      message: addNameToString("email must be a non-empty string", name),
    });

export const emailType = namedEmailType();

export const namedTimetableIDType = (name?: string) =>
  z.coerce.string({
    error: (issue) =>
      issue.input === undefined
        ? addNameToString("timetable id is required", name)
        : addNameToString("timetable id not a string", name),
  });

export const timetableIDType = namedTimetableIDType();

export const namedNonEmptyStringType = (name?: string) =>
  z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? addNameToString("is required", name)
          : addNameToString("not a string", name),
    })
    .min(1, { message: addNameToString("must be a non-empty string", name) });

export const nonEmptyStringType = namedNonEmptyStringType();

export const namedBooleanType = (name?: string) =>
  z.boolean({
    error: (issue) =>
      issue.input === undefined
        ? addNameToString("is required", name)
        : addNameToString("not a boolean", name),
  });
export const booleanType = namedBooleanType();

export const namedIntegerType = (name?: string) =>
  z.int({
    message: addNameToString("is an invalid integer", name),
  });
export const integerType = namedIntegerType();

export const namedYearType = (name?: string) =>
  z
    .int({
      message: addNameToString("year is an invalid year", name),
    })
    .positive({
      message: addNameToString("year is an invalid year", name),
    })
    .lte(3000)
    .gte(1900);
export const yearType = namedYearType();

export const namedCollegeYearType = (name?: string) =>
  z
    .int({
      message: addNameToString("college year is an invalid year", name),
    })
    .positive({
      message: addNameToString("college year is an invalid year", name),
    })
    .lte(6, {
      message: addNameToString("college year is an invalid year", name),
    })
    .gte(1, {
      message: addNameToString("college year is an invalid year", name),
    });
export const collegeYearType = namedCollegeYearType();

export const namedSemesterType = (name?: string) =>
  z
    .int({
      message: addNameToString("semester is not an integer", name),
    })
    .gte(1, {
      message: addNameToString(
        "semester number invalid (can only be 1 or 2)",
        name,
      ),
    })
    .lte(2, {
      message: addNameToString(
        "semester number invalid (can only be 1 or 2)",
        name,
      ),
    });
export const semesterType = namedSemesterType();

export const namedISOTimestampType = (name?: string) =>
  z.iso
    .datetime({
      message: addNameToString("time must be a valid ISO timestamp", name),
    })
    .min(1, {
      message: addNameToString("time must be a non-empty string", name),
    });
export const isoTimestampType = namedISOTimestampType();

export const namedShortBITSIDType = (name?: string) =>
  z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? addNameToString("BITS ID is required", name)
          : addNameToString("BITS ID is not a string", name),
    })
    .regex(new RegExp(/^f20[0-9]{6}$/), {
      message: addNameToString("BITS ID is invalid", name),
    });
export const shortBITSIDType = namedShortBITSIDType();
