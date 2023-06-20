import { z } from "zod";

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

export const DegreeZodEnum = z.enum(ApprovedDegreeList);
export const BEDegreeZodEnum = z.enum(ApprovedBEDegreeList);
export const MScDegreeZodEnum = z.enum(ApprovedMScDegreeList);
export const BPharmDegreeZodEnum = z.enum(ApprovedBPharmDegreeList);

export const DegreeZodList = DegreeZodEnum.array();
export const BEDegreeZodList = BEDegreeZodEnum.array();
export const MScDegreeZodList = MScDegreeZodEnum.array();
export const BPharmDegreeZodList = BPharmDegreeZodEnum.array();

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
