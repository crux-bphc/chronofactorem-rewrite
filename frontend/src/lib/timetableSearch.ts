import * as z from "zod/mini";

// zod/mini, since full zod would add ~60 kB to every page for search params
const loose = <T extends z.ZodMiniType>(schema: T) =>
  z.catch(z.optional(schema), undefined);

export const timetableSearchSchema = z.object({
  sheet: loose(z.enum(["courses", "warnings", "announcements"])),
  tab: loose(z.enum(["courses", "exams"])),
  exam: loose(z.enum(["midsem", "compre"])),
  course: loose(z.string().check(z.minLength(1))),
  type: loose(z.enum(["L", "P", "T"])),
  view: loose(z.enum(["day", "week"])),
  day: loose(z.int().check(z.minimum(0), z.maximum(5))),
  q: loose(z.string()),
});

export type TimetableSearch = z.infer<typeof timetableSearchSchema>;
