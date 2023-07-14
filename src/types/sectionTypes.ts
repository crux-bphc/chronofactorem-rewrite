import { z } from "zod";
import { addNameToString } from "./zodFieldTypes";

// !!! IMPORTANT: THIS IS THE SOURCE OF TRUTH FOR SECTION TYPES
export const ApprovedSectionTypeList = ["L", "P", "T"] as const;

export const NamedSectionTypeZodEnum = (name?: string) =>
  z.enum(ApprovedSectionTypeList, {
    required_error: addNameToString("section type is required", name),
    invalid_type_error: addNameToString("section type is not valid", name),
  });
export const SectionTypeZodEnum = NamedSectionTypeZodEnum();

export const NamedSectionTypeZodList = (name?: string) =>
  NamedSectionTypeZodEnum(name).array();
export const SectionTypeZodList = NamedSectionTypeZodList();

export type SectionTypeEnum = z.infer<typeof SectionTypeZodEnum>;

export type SectionTypeList = z.infer<typeof SectionTypeZodList>;

export const isAValidSectionType = (
  degree: string
): degree is SectionTypeEnum => {
  return ApprovedSectionTypeList.includes(degree as SectionTypeEnum);
};
