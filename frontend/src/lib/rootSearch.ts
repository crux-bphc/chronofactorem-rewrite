import * as z from "zod/mini";

// Deliberately a loose string: TanStack validates the root first and hands its
// output to each child, so an enum here would erase `sheet=courses` before the
// timetable routes saw it.
export const rootSearchSchema = z.object({
  sheet: z.catch(z.optional(z.string()), undefined),
});

export type RootSearch = z.infer<typeof rootSearchSchema>;
