import type { CSSProperties } from "react";

type Pos = { day: number; hour: number; fraction: number };

const dot = "now-dot pointer-events-none absolute size-2.5 rounded-full bg-now";

function AgendaLine({ label, during }: { label: string; during: boolean }) {
  return (
    <div className="mb-2.5 grid grid-cols-[64px_1fr] items-center gap-3">
      <div className="whitespace-nowrap text-right text-sm font-semibold text-now">
        {label}
      </div>
      <div
        role="img"
        aria-label={`Now, ${label}${during ? ", during a class" : ""}`}
        className="relative h-0.5 bg-now"
      >
        <span className={`${dot} top-1/2 left-0 -translate-y-1/2`} />
      </div>
    </div>
  );
}

type GridProps = {
  pos: Pos;
  /** x: desktop rows (time runs across). y: phone week and desktop columns. */
  axis: "x" | "y";
  label: string;
  /** where today's cell for pos.hour sits in the grid */
  cell: CSSProperties;
  /** the axis track (hour column or hour header row) for the same hour */
  track: CSSProperties;
  /** the label's background, matching the surface it sits on */
  labelClass: string;
};

function GridLine({ pos, axis, label, cell, track, labelClass }: GridProps) {
  const x = axis === "x";
  const f = { "--f": pos.fraction, containerType: "size" } as CSSProperties;
  const move = (shift: string) =>
    x
      ? `translateX(calc(var(--f) * 100cqw${shift}))`
      : `translateY(calc(var(--f) * 100cqh${shift}))`;
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none relative z-2"
        style={{ ...cell, ...f }}
      >
        <div
          className={`now-rule absolute bg-now ${
            x ? "top-0 -bottom-[3px] w-0.5" : "top-0 -right-[3px] left-0 h-0.5"
          }`}
          style={{ transform: move(" - 1px") }}
        >
          <span
            className={`${dot} ${
              x
                ? "-top-1 left-1/2 -translate-x-1/2"
                : "top-1/2 -left-1 -translate-y-1/2"
            }`}
          />
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none relative z-2"
        style={{ ...track, ...f }}
      >
        <span
          className={`now-rule absolute left-0 ${x ? "bottom-0" : "top-0"} whitespace-nowrap text-sm font-semibold text-now ${labelClass} ${
            x ? "px-0.5" : "pr-1 pl-0.5"
          }`}
          style={{
            transform: x
              ? `${move("")} translateX(-50%)`
              : `${move("")} translateY(-50%)`,
          }}
        >
          {label}
        </span>
      </div>
    </>
  );
}

export const NowLine = { Agenda: AgendaLine, Grid: GridLine };
