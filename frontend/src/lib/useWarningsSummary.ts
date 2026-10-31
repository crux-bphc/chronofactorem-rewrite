import { useMemo } from "react";
import { useTimetableState } from "@/context";
import { getMissingCdcs } from "@/utils/timetable";

type SectionType = "L" | "P" | "T";

/** Everything the warnings surfaces (rows, chip, sheet title) need. */
export function useWarningsSummary() {
  const {
    state: { courses, timetable, cdcs, coursesInTimetable },
  } = useTimetableState();

  return useMemo(() => {
    const missingSections = (timetable?.warnings ?? []).map((warning) => {
      const [code, types = ""] = warning.split(":");
      const course = courses?.find((c) => c.code === code);
      return {
        code,
        name: course?.name ?? null,
        courseId: course?.id ?? null,
        types: types.split("").filter((t): t is SectionType => /[LPT]/.test(t)),
      };
    });
    const missingCdcs = getMissingCdcs(cdcs, coursesInTimetable);
    const notFound = cdcs.flatMap((c) =>
      c.id === null && c.type === "warning" ? [c.warning] : [],
    );
    const count =
      missingSections.reduce((n, s) => n + s.types.length, 0) +
      missingCdcs.length +
      notFound.length;
    return {
      missingSections,
      missingCdcs,
      notFound,
      count,
      blocksPublish:
        missingSections.length > 0 || coursesInTimetable.length === 0,
      title:
        missingSections.length > 0
          ? "Complete the missing sections before publishing"
          : missingCdcs.length > 0 || notFound.length > 0
            ? "You haven't added all CDCs for this semester to your timetable."
            : null,
    };
  }, [courses, timetable, cdcs, coursesInTimetable]);
}
