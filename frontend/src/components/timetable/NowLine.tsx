import type { CSSProperties } from "react";

type Pos = { day: number; hour: number; fraction: number };

const dot = "now-dot pointer-events-none absolute size-2.5 rounded-full bg-now";

/** The now-line in a free gap, or in the break after a class. */
function AgendaLine({ label }: { label: string }) {
  return (
    <div className="mb-2.5 grid grid-cols-[64px_1fr] items-center gap-3">
      <div className="whitespace-nowrap text-right text-sm font-semibold text-now">
        {label}
      </div>
      <div
        role="img"
        aria-label={`Now, ${label}`}
        className="relative h-0.5 bg-now"
      >
        <span className={`${dot} top-1/2 left-0 -translate-y-1/2`} />
      </div>
    </div>
  );
}

/**
 * The now-line for the class that is on: at the share of the class gone by,
 * the time in the time column and a rule from there to the block's left edge,
 * where the dot sits. It never crosses the block. Laid over the agenda row's
 * two-column grid.
 */
function ThroughLine({ label, at }: { label: string; at: number }) {
  // the row clips its content (it collapses on removal), so keep the label
  // and dot inside it at the very start and end of the class
  const top = `clamp(10px, ${at * 100}%, 100% - 10px)`;
  return (
    <div className="pointer-events-none absolute inset-0 grid grid-cols-[64px_1fr] gap-3">
      <div className="relative">
        <div
          role="img"
          aria-label={`Now, ${label}, during a class`}
          className="now-rule absolute -right-3 w-3.5 h-0.5 -translate-y-1/2 bg-now"
          style={{ top }}
        >
          <span className={`${dot} top-1/2 -right-1.5 -translate-y-1/2`} />
        </div>
        <span
          className="now-rule absolute right-0 -translate-y-1/2 whitespace-nowrap rounded-full bg-bg pl-1 text-sm font-semibold text-now"
          style={{ top }}
        >
          {label}
        </span>
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
  /** the same hour across every day (the whole row or column) */
  band: CSSProperties;
};

// the line runs faintly across every day and solid through today from a dot
// at the start of today's column. the time sits on the line as a pill: at the
// end of today's column, clear of the left-aligned block text (when time runs
// across, above the dot in the gap over today's row). a column too narrow
// for both (phone week) puts it straight after the dot instead
function GridLine({ pos, axis, label, cell, band }: GridProps) {
  const x = axis === "x";
  const f = { "--f": pos.fraction, containerType: "size" } as CSSProperties;
  const rule = `now-rule absolute bg-now ${
    x ? "top-0 -bottom-[3px] w-0.5" : "top-0 -right-[3px] left-0 h-0.5"
  }`;
  const move = {
    transform: x
      ? "translateX(calc(var(--f) * 100cqw - 1px))"
      : "translateY(calc(var(--f) * 100cqh - 1px))",
  };
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none relative z-2"
        style={{ ...band, ...f }}
      >
        <div className={`${rule} opacity-35`} style={move} />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none relative z-3"
        style={{ ...cell, ...f }}
      >
        <div className={rule} style={move}>
          <span
            className={`absolute rounded-full bg-surface px-1.5 text-[11px] leading-4 font-semibold whitespace-nowrap text-now ring-1 ring-now/40 ${
              x
                ? "-top-[15px] left-1/2 -translate-x-1/2"
                : "top-1/2 right-[7px] -translate-y-1/2 @max-[120px]:right-auto @max-[120px]:left-2"
            }`}
          >
            {label}
          </span>
          <span
            className={`${dot} ${
              x
                ? "-top-1 left-1/2 -translate-x-1/2"
                : "top-1/2 -left-1 -translate-y-1/2"
            }`}
          />
        </div>
      </div>
    </>
  );
}

export const NowLine = {
  Agenda: AgendaLine,
  Through: ThroughLine,
  Grid: GridLine,
};
