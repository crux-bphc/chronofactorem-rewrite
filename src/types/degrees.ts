import { z } from "zod";
import { addNameToString } from "./zodFieldTypes";

// !!! IMPORTANT: THIS IS THE SOURCE OF TRUTH FOR DEGREES
export const approvedDegreeList = [
  "A1",
  "A2",
  "A3",
  "A4",
  "A5",
  "A7",
  "A8",
  "AA",
  "B1",
  "B2",
  "B3",
  "B4",
  "B5",
] as const;

export const approvedBEDegreeList = [
  "A1",
  "A2",
  "A3",
  "A4",
  "A7",
  "A8",
  "AA",
] as const;

export const approvedMScDegreeList = ["B1", "B2", "B3", "B4", "B5"] as const;

export const approvedBPharmDegreeList = ["A5"] as const;

export const namedDegreeZodEnum = (name?: string) =>
  z.enum(approvedDegreeList, {
    required_error: addNameToString("degree is required", name),
    invalid_type_error: addNameToString("degree is not valid", name),
  });
export const degreeZodEnum = namedDegreeZodEnum();

export const namedBEDegreeZodEnum = (name?: string) =>
  z.enum(approvedBEDegreeList, {
    required_error: addNameToString("BE degree is required", name),
    invalid_type_error: addNameToString("BE degree is not valid", name),
  });
export const beDegreeZodEnum = namedBEDegreeZodEnum();

export const namedMScDegreeZodEnum = (name?: string) =>
  z.enum(approvedMScDegreeList, {
    required_error: addNameToString("MSc degree is required", name),
    invalid_type_error: addNameToString("MSc degree is not valid", name),
  });
export const mscDegreeZodEnum = namedMScDegreeZodEnum();

export const namedBPharmDegreeZodEnum = (name?: string) =>
  z.enum(approvedBPharmDegreeList, {
    required_error: addNameToString("BPharm degree is required", name),
    invalid_type_error: addNameToString("BPharm degree is not valid", name),
  });
export const bpharmDegreeZodEnum = namedBPharmDegreeZodEnum();

export const namedDegreeZodList = (name?: string) =>
  namedDegreeZodEnum(name).array();
export const degreeZodList = namedDegreeZodList();

export const namedBEDegreeZodList = (name?: string) =>
  namedBEDegreeZodEnum(name).array();
export const beDegreeZodList = namedBEDegreeZodList();

export const namedMScDegreeZodList = (name?: string) =>
  namedMScDegreeZodEnum(name).array();
export const mscDegreeZodList = namedMScDegreeZodList();

export const namedBPharmDegreeZodList = (name?: string) =>
  namedBPharmDegreeZodEnum(name).array();
export const bpharmDegreeZodList = namedBPharmDegreeZodList();

export type degreeEnum = z.infer<typeof degreeZodEnum>;
export type beDegreeEnum = z.infer<typeof beDegreeZodEnum>;
export type mscDegreeEnum = z.infer<typeof mscDegreeZodEnum>;
export type bpharmDegreeEnum = z.infer<typeof bpharmDegreeZodEnum>;

export type degreeList = z.infer<typeof degreeZodList>;
export type beDegreeList = z.infer<typeof beDegreeZodList>;
export type mscDegreeList = z.infer<typeof mscDegreeZodList>;
export type bpharmDegreeList = z.infer<typeof bpharmDegreeZodList>;

export const isAValidDegree = (degree: string): degree is degreeEnum => {
  return approvedDegreeList.includes(degree as degreeEnum);
};
export const isAValidBEDegree = (degree: string): degree is beDegreeEnum => {
  return approvedBEDegreeList.includes(degree as beDegreeEnum);
};
export const isAValidMScDegree = (degree: string): degree is mscDegreeEnum => {
  return approvedMScDegreeList.includes(degree as mscDegreeEnum);
};
export const isAValidBPharmDegree = (
  degree: string
): degree is bpharmDegreeEnum => {
  return approvedBPharmDegreeList.includes(degree as bpharmDegreeEnum);
};

export const isAValidDegreeCombination = (degrees: string[]): boolean => {
  return (
    degrees.length == 2 &&
    (degrees[0] < degrees[1]
      ? isAValidBEDegree(degrees[0]) && isAValidMScDegree(degrees[1])
      : isAValidBEDegree(degrees[1]) && isAValidMScDegree(degrees[0]))
  );
};
