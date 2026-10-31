import { Columns3, Menu, Rows3 } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { useSurfaceNav } from "@/lib/useSurfaceNav";
import { useTimetableNav } from "@/lib/useTimetableNav";
import { timetableDayNames } from "@/utils/timetableGrid";

/** Interim phone controls. Remove when PR 4's dock lands. */
export function InterimPhoneControls({
  dayCount,
  action,
}: {
  dayCount: number;
  /** Publish or PNG, until the dock carries them. */
  action: React.ReactNode;
}) {
  const { view, day, setView, showDay } = useSurfaceNav(dayCount);
  const { openSheet } = useTimetableNav();
  return (
    <div data-shot="grid" className="mt-3 mb-3 space-y-2 px-4">
      <div className="flex gap-2 [&>*]:flex-1">
        <Button variant="secondary" onClick={() => openSheet("courses")}>
          <Menu aria-hidden="true" />
          Courses and exams
        </Button>
        {action}
      </div>
      <div className="flex gap-1.5">
        {timetableDayNames.slice(0, dayCount).map((name, i) => (
          <button
            key={name}
            type="button"
            aria-label={name}
            aria-pressed={view === "day" && day === i}
            onClick={() => showDay(i)}
            className="min-h-11 flex-1 cursor-pointer rounded-full text-base font-medium text-ink-muted aria-pressed:bg-ink aria-pressed:text-bg focus-visible:outline-2 focus-visible:outline-ring"
          >
            {name.slice(0, 3)}
          </button>
        ))}
      </div>
      <Segmented
        value={view}
        onValueChange={setView}
        aria-label="Choose a layout"
        options={[
          { value: "day", label: <Rows3 size={18} />, "aria-label": "Day" },
          {
            value: "week",
            label: <Columns3 size={18} />,
            "aria-label": "Week",
          },
        ]}
      />
    </div>
  );
}
