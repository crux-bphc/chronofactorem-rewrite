import { z } from "zod";
import { addNameToString } from "./zodFieldTypes";

// !!! IMPORTANT: THIS IS THE SOURCE OF TRUTH FOR DEGREES
export const ApprovedDegreeList = [
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

export const ApprovedBEDegreeList = [
  "A1",
  "A2",
  "A3",
  "A4",
  "A7",
  "A8",
  "AA",
] as const;

export const ApprovedMScDegreeList = ["B1", "B2", "B3", "B4", "B5"] as const;

export const ApprovedBPharmDegreeList = ["A5"] as const;

export const NamedDegreeZodEnum = (name?: string) =>
  z.enum(ApprovedDegreeList, {
    required_error: addNameToString("degree is required", name),
    invalid_type_error: addNameToString("degree is not valid", name),
  });
export const DegreeZodEnum = NamedDegreeZodEnum();

export const NamedBEDegreeZodEnum = (name?: string) =>
  z.enum(ApprovedBEDegreeList, {
    required_error: addNameToString("BE degree is required", name),
    invalid_type_error: addNameToString("BE degree is not valid", name),
  });
export const BEDegreeZodEnum = NamedBEDegreeZodEnum();

export const NamedMScDegreeZodEnum = (name?: string) =>
  z.enum(ApprovedMScDegreeList, {
    required_error: addNameToString("MSc degree is required", name),
    invalid_type_error: addNameToString("MSc degree is not valid", name),
  });
export const MScDegreeZodEnum = NamedMScDegreeZodEnum();

export const NamedBPharmDegreeZodEnum = (name?: string) =>
  z.enum(ApprovedBPharmDegreeList, {
    required_error: addNameToString("BPharm degree is required", name),
    invalid_type_error: addNameToString("BPharm degree is not valid", name),
  });
export const BPharmDegreeZodEnum = NamedBPharmDegreeZodEnum();

export const NamedDegreeZodList = (name?: string) =>
  NamedDegreeZodEnum(name).array();
export const DegreeZodList = NamedDegreeZodList();

export const NamedBEDegreeZodList = (name?: string) =>
  NamedBEDegreeZodEnum(name).array();
export const BEDegreeZodList = NamedBEDegreeZodList();

export const NamedMScDegreeZodList = (name?: string) =>
  NamedMScDegreeZodEnum(name).array();
export const MScDegreeZodList = NamedMScDegreeZodList();

export const NamedBPharmDegreeZodList = (name?: string) =>
  NamedBPharmDegreeZodEnum(name).array();
export const BPharmDegreeZodList = NamedBPharmDegreeZodList();

export type DegreeEnum = z.infer<typeof DegreeZodEnum>;
export type BEDegreeEnum = z.infer<typeof BEDegreeZodEnum>;
export type MScDegreeEnum = z.infer<typeof MScDegreeZodEnum>;
export type BPharmDegreeEnum = z.infer<typeof BPharmDegreeZodEnum>;

export type DegreeList = z.infer<typeof DegreeZodList>;
export type BEDegreeList = z.infer<typeof BEDegreeZodList>;
export type MScDegreeList = z.infer<typeof MScDegreeZodList>;
export type BPharmDegreeList = z.infer<typeof BPharmDegreeZodList>;

export const isAValidDegree = (degree: string): degree is DegreeEnum => {
  return ApprovedDegreeList.includes(degree as DegreeEnum);
};
export const isAValidBEDegree = (degree: string): degree is BEDegreeEnum => {
  return ApprovedBEDegreeList.includes(degree as BEDegreeEnum);
};
export const isAValidMScDegree = (degree: string): degree is MScDegreeEnum => {
  return ApprovedMScDegreeList.includes(degree as MScDegreeEnum);
};
export const isAValidBPharmDegree = (
  degree: string
): degree is BPharmDegreeEnum => {
  return ApprovedBPharmDegreeList.includes(degree as BPharmDegreeEnum);
};

export const isAValidDegreeCombination = (degrees: string[]): boolean => {
  return (
    degrees.length == 2 &&
    (degrees[0] < degrees[1]
      ? isAValidBEDegree(degrees[0]) && isAValidMScDegree(degrees[1])
      : isAValidBEDegree(degrees[1]) && isAValidMScDegree(degrees[0]))
  );
};
