import { Bird } from "lucide-react";
import { useMemo } from "react";
import { formatClock, formatSlotEnd } from "@/utils/timeFormat";
import {
  buildAgenda,
  type TimetableCell,
  titleCase,
} from "@/utils/timetableGrid";

type AgendaProps = {
  cells: TimetableCell[];
  day: number;
  mode: "edit" | "view" | "export";
  pending?: boolean;
  onOpen?: (
    cell: TimetableCell,
    event: React.MouseEvent | React.KeyboardEvent,
  ) => void;
  onRemove?: (cell: TimetableCell) => void;
};

const blockClass =
  "flex w-full justify-between gap-2 rounded-lg bg-ev px-3 pt-[9px] pb-2.5 text-left";

function BlockBody({ cell }: { cell: TimetableCell }) {
  return (
    <>
      <span className="min-w-0">
        <span className="block text-lg font-semibold">{cell.code}</span>
        <span className="block text-sm text-ink-muted">
          {titleCase(cell.name)}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block whitespace-nowrap text-sm font-medium">
          {cell.room}
        </span>
        <span className="block text-sm text-ink-muted">
          {cell.type}
          {cell.number}
        </span>
      </span>
    </>
  );
}

export function Agenda({
  cells,
  day,
  mode,
  pending,
  onOpen,
  onRemove,
}: AgendaProps) {
  const items = useMemo(() => buildAgenda(cells, day), [cells, day]);

  if (items.length === 0) {
    return (
      <div className="tt-agenda flex justify-center px-4 py-12">
        <Bird
          role="img"
          aria-label="No classes"
          size={112}
          strokeWidth={1.25}
          className="text-ink-faint"
        />
      </div>
    );
  }

  return (
    <div className="tt-agenda px-4">
      {items.map((item) =>
        item.kind === "free" ? (
          <div
            key={`free-${item.from}`}
            className="mb-1.5 grid grid-cols-[64px_1fr] gap-3"
          >
            <div className="col-start-2 pt-1 pb-2.5 pl-0.5 text-sm text-ink-faint">
              {`Free · ${formatClock(item.from)} – ${formatClock(item.to)}`}
            </div>
          </div>
        ) : (
          <div
            key={`${item.cell.id}-${item.cell.hour}`}
            className="mb-1.5 grid grid-cols-[64px_1fr] gap-3"
          >
            <div className="pt-2.5 text-right">
              <div className="whitespace-nowrap text-sm font-medium">
                {formatClock(item.cell.hour)}
              </div>
              <div className="whitespace-nowrap text-sm text-ink-faint">
                {formatSlotEnd(item.cell.hour, item.cell.span)}
              </div>
            </div>
            {mode === "edit" ? (
              <button
                type="button"
                disabled={pending}
                onClick={(event) => onOpen?.(item.cell, event)}
                onKeyDown={(event) => {
                  if (event.key === "Delete" || event.key === "Backspace") {
                    event.preventDefault();
                    onRemove?.(item.cell);
                  }
                }}
                aria-label={`Edit ${item.cell.courseId} ${item.cell.type}${item.cell.number}, press Delete to remove`}
                className={`${blockClass} cursor-pointer transition-colors duration-(--d-1) hover:bg-ev-hover focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60`}
              >
                <BlockBody cell={item.cell} />
              </button>
            ) : (
              <div className={blockClass}>
                <BlockBody cell={item.cell} />
              </div>
            )}
          </div>
        ),
      )}
    </div>
  );
}
