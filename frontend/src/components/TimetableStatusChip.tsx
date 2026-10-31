import { Archive, Globe, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Status = { draft: boolean; archived: boolean; private: boolean };

/** Draft, Archived (with its visibility), Private or Public. */
export default function TimetableStatusChip({
  timetable,
}: {
  timetable: Status;
}) {
  if (timetable.draft) return <Badge variant="chip">Draft</Badge>;
  if (timetable.archived) {
    const Visibility = timetable.private ? Lock : Globe;
    return (
      <Badge variant="chip">
        <Archive className="size-3" />
        Archived
        <span aria-hidden="true" className="text-ink-faint">
          ·
        </span>
        <Visibility className="size-3" />
        <span className="sr-only">
          , {timetable.private ? "private" : "public"}
        </span>
      </Badge>
    );
  }
  if (timetable.private)
    return (
      <Badge variant="chip">
        <Lock className="size-3" />
        Private
      </Badge>
    );
  return (
    <Badge variant="chip-brand">
      <Globe className="size-3" />
      Public
    </Badge>
  );
}
