import type { CSSProperties } from "react";

type Pos = { day: number; hour: number; fraction: number };

const dot = "now-dot pointer-events-none absolute size-2.5 rounded-full bg-now";

/** The now-line in a free gap, or in the break after a class. */
function AgendaLine({ label }: { label: string }) {
  return (
    <div className="mb-2.5 grid grid-cols-[64px_1fr] items-center gap-3">
      <div aria-hidden="true" />
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
 * a short rule from the right edge of the time column to the block's left
 * edge, where the dot sits. It never crosses the block. Laid over the agenda row's
 * two-column grid.
 */
function ThroughLine({ label, at }: { label: string; at: number }) {
  // the row clips its content (it collapses on removal), so keep the dot
  // inside it at the very start and end of the class
  const top = `clamp(10px, ${at * 100}%, 100% - 10px)`;
  return (
    <div className="pointer-events-none absolute inset-0 grid grid-cols-[64px_1fr] gap-3">
      <div className="relative">
        <div
          role="img"
          aria-label={`Now, ${label}, during a class`}
          className="now-rule absolute -right-3 w-2 h-0.5 -translate-y-1/2 bg-now"
          style={{ top }}
        >
          <span className={`${dot} top-1/2 -right-1.5 -translate-y-1/2`} />
        </div>
      </div>
    </div>
  );
}

type GridProps = {
  pos: Pos;
  /** x: desktop rows (time runs across). y: phone week and desktop columns. */
  axis: "x" | "y";
  /** where today's cell for pos.hour sits in the grid */
  cell: CSSProperties;
};

// the line is drawn only across today's column (or row), from a dot at its
// start
function GridLine({ pos, axis, cell }: GridProps) {
  const x = axis === "x";
  const f = { "--f": pos.fraction, containerType: "size" } as CSSProperties;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative z-3"
      style={{ ...cell, ...f }}
    >
      <div
        className={`now-rule absolute bg-now ${
          x ? "top-0 bottom-0 w-0.5" : "top-0 right-0 left-0 h-0.5"
        }`}
        style={{
          transform: x
            ? "translateX(calc(var(--f) * 100cqw - 1px))"
            : "translateY(calc(var(--f) * 100cqh - 1px))",
        }}
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
  );
}

export const NowLine = {
  Agenda: AgendaLine,
  Through: ThroughLine,
  Grid: GridLine,
};
