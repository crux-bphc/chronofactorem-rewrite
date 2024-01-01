import { z } from "zod";
import { addNameToString } from "./zodFieldTypes.js";

// !!! IMPORTANT: THIS IS THE SOURCE OF TRUTH FOR SECTION TYPES
export const approvedSectionTypeList = ["L", "P", "T"] as const;

export const namedSectionTypeZodEnum = (name?: string) =>
  z.enum(approvedSectionTypeList, {
    required_error: addNameToString("section type is required", name),
    invalid_type_error: addNameToString("section type is not valid", name),
  });
export const sectionTypeZodEnum = namedSectionTypeZodEnum();

export const namedSectionTypeZodList = (name?: string) =>
  namedSectionTypeZodEnum(name).array();
export const sectionTypeZodList = namedSectionTypeZodList();

export type sectionTypeEnum = z.infer<typeof sectionTypeZodEnum>;

export type sectionTypeList = z.infer<typeof sectionTypeZodList>;

export const isAValidSectionType = (
  degree: string,
): degree is sectionTypeEnum => {
  return approvedSectionTypeList.includes(degree as sectionTypeEnum);
};
