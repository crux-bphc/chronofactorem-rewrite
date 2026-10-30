import { z } from "zod";

// Deliberately a loose string: TanStack validates the root first and hands its
// output to each child, so an enum here would erase `sheet=courses` before the
// timetable routes saw it.
export const rootSearchSchema = z.object({
  sheet: z.string().optional().catch(undefined),
});

export type RootSearch = z.infer<typeof rootSearchSchema>;
