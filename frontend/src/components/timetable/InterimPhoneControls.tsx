import { Columns3, Rows3 } from "lucide-react";
import { Segmented } from "@/components/ui/segmented";
import { useSurfaceNav } from "@/lib/useSurfaceNav";
import { timetableDayNames } from "@/utils/timetableGrid";

/** Interim phone controls. Remove when PR 4's dock lands. */
export function InterimPhoneControls({ dayCount }: { dayCount: number }) {
  const { view, day, setView, showDay } = useSurfaceNav(dayCount);
  return (
    <div className="mb-3 space-y-2 px-4">
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
