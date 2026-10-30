import type { courseType, timetableWithSectionsType } from "lib";
import { unknownDegree } from "lib";
import type z from "zod";
import type { CDCType } from "@/context/types";
import CDCList from "@/data/CDCs.json";

export const filterCoursesInTimetable = (
  courses: z.infer<typeof courseType>[],
  timetable: z.infer<typeof timetableWithSectionsType>,
) => {
  const timetableCourses = new Set(timetable.sections.map((x) => x.courseId));
  return courses.filter((x) => timetableCourses.has(x.id));
};

export type TimetableSectionType = {
  id: string;
  name: string;
  roomTime: string[];
  courseId: string;
  type: string;
  number: number;
  instructors: string[];
};

export const getFilledTimetableSections = (
  courses: z.infer<typeof courseType>[],
  timetable: z.infer<typeof timetableWithSectionsType>,
) => {
  const courseMap = new Map(courses.map((x) => [x.id, x] as const));
  return timetable.sections.map((x) => {
    const course = courseMap.get(x.courseId) as z.infer<typeof courseType>;
    return {
      ...x,
      name: course.name,
      courseId: course.code,
    };
  });
};

export const formatCDCWarningsAndOptions = (
  courses: z.infer<typeof courseType>[],
  timetable: z.infer<typeof timetableWithSectionsType>,
) => {
  let cdcs: string[];
  const coursesList = [];

  if (timetable === undefined || courses === undefined) return [];

  // CDCs.json is keyed by degree combo: the timetable's degrees sorted,
  // reversed, and joined (for example "B1A1"). Each combo maps
  // "year-semester" to course codes, where "ECON/MGTS F211/F211" means
  // either course counts.
  // This only works because B-series duals are keyed by that concatenation.
  // Reverse duals like "A3B4" and other degree codes (RMIT, other 2+2 programs) may not match.
  const degree = (
    timetable.degrees.length === 1
      ? timetable.degrees[0]
      : [...timetable.degrees].sort().reverse().join("")
  ) as keyof typeof CDCList;
  const cdcListKey =
    `${timetable.year}-${timetable.semester}` as keyof (typeof CDCList)[typeof degree];

  if (degree in CDCList && cdcListKey in CDCList[degree]) {
    cdcs = CDCList[degree][cdcListKey];
  } else {
    return [];
  }

  // Code based on temp frontend
  for (let i = 0; i < cdcs.length; i++) {
    if (cdcs[i].includes("/")) {
      const [depts, codes] = cdcs[i].split(" ");
      const options: string[] = [];
      for (let j = 0; j < depts.split("/").length; j++) {
        options.push(`${depts.split("/")[j]} ${codes.split("/")[j]}`);
      }
      const matchedCourses = courses.filter((e) => options.includes(e.code));
      if (matchedCourses.length === 0) {
        coursesList.push({
          id: null,
          type: "warning" as const,
          warning: `One CDC of ${options.join(", ")} not found`,
        });
      } else {
        // A partly found set still offers the options that exist; each
        // missing option is reported on its own.
        coursesList.push({
          id: null,
          type: "optional" as const,
          options: matchedCourses,
        });
        for (const code of options) {
          if (!matchedCourses.some((e) => e.code === code)) {
            coursesList.push({
              id: null,
              type: "warning" as const,
              warning: `CDC ${code} not found`,
            });
          }
        }
      }
    } else {
      const matchedCourses = courses.filter((e) => e.code === cdcs[i]);
      if (matchedCourses.length === 1) {
        coursesList.push(matchedCourses[0]);
      } else {
        coursesList.push({
          id: null,
          type: "warning" as const,
          warning: `CDC ${cdcs[i]} not found`,
        });
      }
    }
  }

  return coursesList;
};

type Course = z.infer<typeof courseType>;

export type RemainingEntry =
  | { kind: "course"; course: Course }
  | { kind: "set"; key: string; options: Course[] };

/**
 * CDCs not yet in the timetable, in CDC order. A set leaves as soon as any
 * of its options is added. Not-found warnings are never included.
 */
export const getRemainingCdcs = (
  cdcs: CDCType[],
  added: Course[],
): RemainingEntry[] => {
  const addedIds = new Set(added.map((c) => c.id));
  const remaining: RemainingEntry[] = [];
  for (const cdc of cdcs) {
    if (cdc.id !== null) {
      if (!addedIds.has(cdc.id))
        remaining.push({ kind: "course", course: cdc });
    } else if (cdc.type === "optional") {
      if (!cdc.options.some((o) => addedIds.has(o.id))) {
        remaining.push({
          kind: "set",
          key: cdc.options.map((o) => o.id).join("|"),
          options: cdc.options,
        });
      }
    }
  }
  return remaining;
};

/** CDCs missing from the timetable. An unsatisfied set has no course id. */
export const getMissingCdcs = (
  cdcs: CDCType[],
  added: Course[],
): { courseId: string | null; code: string; name: string }[] =>
  getRemainingCdcs(cdcs, added).map((entry) => {
    const single =
      entry.kind === "course"
        ? entry.course
        : entry.options.length === 1
          ? entry.options[0]
          : null;
    return single
      ? { courseId: single.id, code: single.code, name: single.name }
      : {
          courseId: null,
          code: (entry as Extract<RemainingEntry, { kind: "set" }>).options
            .map((c) => c.code)
            .join(" (or) "),
          name: "",
        };
  });

export const timetableMeta = (t: {
  year: number;
  semester: number;
  acadYear: number;
  degrees: string[];
}): string[] => {
  const parts: string[] = [];
  if (t.year !== 0) parts.push(`${t.year}-${t.semester}`);
  parts.push(`${t.acadYear}–${String(t.acadYear + 1).slice(2)}`);
  if (!t.degrees.includes(unknownDegree)) parts.push(t.degrees.join(""));
  return parts;
};
