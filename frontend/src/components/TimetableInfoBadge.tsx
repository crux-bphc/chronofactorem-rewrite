import type { timetableType } from "lib";
import type { z } from "zod";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

export default function TimetableInfoBadge({
  timetable,
  className,
}: { timetable: z.infer<typeof timetableType> } & React.ComponentProps<
  typeof Badge
>) {
  return (
    <Badge
      variant="default"
      className={cn(
        "rounded-md flex items-center border-0 divide-x divide-accent",
        "p-0 px-0.5 *:py-0.5 *:px-1.5",
        "text-sm tracking-wide",
        className,
      )}
    >
      <span>{`${timetable.year} - ${timetable.semester}`}</span>
      <span>
        {timetable.acadYear}-{(timetable.acadYear + 1).toString().slice(2)}
      </span>
      <span>{timetable.degrees.join("")}</span>
    </Badge>
  );
}
