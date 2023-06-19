import { z } from "zod";

// !!! IMPORTANT: THIS IS THE SOURCE OF TRUTH FOR SECTION TYPES
export const ApprovedSectionTypeList = ["L", "P", "T"] as const;

export const SectionTypeZodEnum = z.enum(ApprovedSectionTypeList);

export const SectionTypeZodList = SectionTypeZodEnum.array();

export type SectionTypeEnum = z.infer<typeof SectionTypeZodEnum>;

export type SectionTypeList = z.infer<typeof SectionTypeZodList>;

export const isAValidSectionType = (
  degree: string
): degree is SectionTypeEnum => {
  return ApprovedSectionTypeList.includes(degree as SectionTypeEnum);
};
