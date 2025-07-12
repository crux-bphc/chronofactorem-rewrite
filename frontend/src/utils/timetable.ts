import type { courseType, timetableWithSectionsType } from "lib";
import type z from "zod";
import CDCList from "@/../CDCs.json";

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

  const degree = (
    timetable.degrees.length === 1
      ? timetable.degrees[0]
      : timetable.degrees.sort().reverse().join("")
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
      if (matchedCourses.length < options.length) {
        coursesList.push({
          id: null,
          type: "warning" as const,
          warning: `One CDC of ${options.join(", ")} not found`,
        });
      } else {
        coursesList.push({
          id: null,
          type: "optional" as const,
          options: matchedCourses,
        });
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
