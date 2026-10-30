import { z } from "zod";

export const timetableSearchSchema = z.object({
  sheet: z
    .enum(["courses", "warnings", "announcements"])
    .optional()
    .catch(undefined),
  tab: z.enum(["courses", "exams"]).optional().catch(undefined),
  exam: z.enum(["midsem", "compre"]).optional().catch(undefined),
  course: z.string().min(1).optional().catch(undefined),
  type: z.enum(["L", "P", "T"]).optional().catch(undefined),
  view: z.enum(["day", "week"]).optional().catch(undefined),
  day: z.number().int().min(0).max(5).optional().catch(undefined),
  q: z.string().optional().catch(undefined),
});

export type TimetableSearch = z.infer<typeof timetableSearchSchema>;
