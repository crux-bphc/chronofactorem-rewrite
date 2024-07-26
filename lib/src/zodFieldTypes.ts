import { z } from "zod";

// !!! IMPORTANT: THIS IS THE SOURCE OF TRUTH FOR THESE TYPES
export const addNameToString = (string: string, name?: string) =>
  name ? `${name} ${string}` : string;

export const namedUUIDType = (name?: string) =>
  z
    .string({
      invalid_type_error: addNameToString("id not a string", name),
      required_error: addNameToString("id is required", name),
    })
    .min(1, {
      message: addNameToString("id must be a non-empty string", name),
    })
    .uuid({ message: addNameToString("id must be a valid uuid", name) });

export const uuidType = namedUUIDType();

export const namedEmailType = (name?: string) =>
  z
    .string({
      invalid_type_error: addNameToString("email not a string", name),
      required_error: addNameToString("email is required", name),
    })
    .min(1, {
      message: addNameToString("email must be a non-empty string", name),
    })
    .email({
      message: addNameToString("email must be a valid email", name),
    });

export const emailType = namedEmailType();

export const namedTimetableIDType = (name?: string) =>
  z.coerce.string({
    invalid_type_error: addNameToString("timetable id not a string", name),
    required_error: addNameToString("timetable id is required", name),
  });

export const timetableIDType = namedTimetableIDType();

export const namedNonEmptyStringType = (name?: string) =>
  z
    .string({
      invalid_type_error: addNameToString("not a string", name),
      required_error: addNameToString("is required", name),
    })
    .min(1, { message: addNameToString("must be a non-empty string", name) });

export const nonEmptyStringType = namedNonEmptyStringType();

export const namedBooleanType = (name?: string) =>
  z.boolean({
    invalid_type_error: addNameToString("not a boolean", name),
    required_error: addNameToString("is required", name),
  });
export const booleanType = namedBooleanType();

export const namedIntegerType = (name?: string) =>
  z.coerce
    .number({
      invalid_type_error: addNameToString("not a number", name),
      required_error: addNameToString("is required", name),
    })
    .int({
      message: addNameToString("is an invalid integer", name),
    });
export const integerType = namedIntegerType();

export const namedYearType = (name?: string) =>
  z.coerce
    .number({
      invalid_type_error: addNameToString("year is not a number", name),
      required_error: addNameToString("year is required", name),
    })
    .positive({
      message: addNameToString("year is an invalid year", name),
    })
    .int({
      message: addNameToString("year is an invalid year", name),
    })
    .lte(3000)
    .gte(1900);
export const yearType = namedYearType();

export const namedCollegeYearType = (name?: string) =>
  z.coerce
    .number({
      invalid_type_error: addNameToString("college year is not a number", name),
      required_error: addNameToString("college year is required", name),
    })
    .positive({
      message: addNameToString("college year is an invalid year", name),
    })
    .int({
      message: addNameToString("college year is an invalid year", name),
    })
    .lte(6)
    .gte(1);
export const collegeYearType = namedCollegeYearType();

export const namedSemesterType = (name?: string) =>
  z.coerce
    .number({
      invalid_type_error: addNameToString("semester is not a number", name),
      required_error: addNameToString("semester is required", name),
    })
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
  z
    .string({
      invalid_type_error: addNameToString("time not a string", name),
      required_error: addNameToString("time is required", name),
    })
    .min(1, {
      message: addNameToString("time must be a non-empty string", name),
    })
    .datetime({
      message: "time must be a valid ISO timestamp",
    });
export const isoTimestampType = namedISOTimestampType();
