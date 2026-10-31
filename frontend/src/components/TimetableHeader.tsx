import { Fragment } from "react";
import TimetableStatusChip from "@/components/TimetableStatusChip";
import {
  CopyButton,
  ExportButton,
  MoreMenu,
  OrientationToggle,
  PublishButton,
  WarningsButton,
  WarningsChip,
} from "@/components/timetable/HeaderActions";
import { useTimetableState } from "@/context";
import { formatRelative, formatTimestamp } from "@/lib/formatTime";
import { TIMETABLE_TITLE_VT } from "@/lib/sharedTransition";
import { useNow } from "@/lib/useNow";
import type { ExportStatus } from "@/lib/useTimetableExport";
import { timetableMeta } from "@/utils/timetable";

const Dot = () => (
  <span aria-hidden="true" className="text-ink-faint">
    ·
  </span>
);

const TimetableHeader = ({
  page,
  exportStatus = "idle",
  onExport,
}: {
  page: "edit" | "view";
  exportStatus?: ExportStatus;
  onExport?: () => void;
}) => {
  const {
    state: { timetable, screenIsLarge },
  } = useTimetableState();
  // Only the desktop header shows "Last Updated", so only it needs to tick.
  const now = useNow(screenIsLarge);

  if (timetable === undefined) return null;

  const meta = timetableMeta(timetable).map((part, i) => (
    <Fragment key={part}>
      {i > 0 && <Dot />}
      <span className={i === 0 ? "font-medium text-ink" : undefined}>
        {part}
      </span>
    </Fragment>
  ));

  const updated = new Date(timetable.lastUpdated);

  if (!screenIsLarge) {
    return (
      <div data-shot="timetable-header" className="border-b border-line">
        <div className="mx-auto flex max-w-[640px] items-start justify-between gap-2 px-4 pt-0.5 pb-3">
          <div className="min-w-0">
            <h1
              style={{ viewTransitionName: TIMETABLE_TITLE_VT }}
              className="text-2xl font-semibold leading-[1.15] tracking-[-.02em] break-words"
            >
              {timetable.name}
            </h1>
            <div className="mt-[5px] flex flex-wrap items-center gap-[7px] text-[13px] text-ink-muted">
              {meta}
              {page === "edit" ? (
                <WarningsChip />
              ) : (
                <TimetableStatusChip timetable={timetable} />
              )}
            </div>
          </div>
          <MoreMenu page={page} layout="phone" />
        </div>
      </div>
    );
  }

  return (
    <div
      data-shot="timetable-header"
      className="flex items-end justify-between gap-4 px-7 pt-[22px] pb-[18px]"
    >
      <div className="min-w-0">
        <h1
          style={{ viewTransitionName: TIMETABLE_TITLE_VT }}
          className="text-3xl font-semibold leading-[1.15] tracking-[-.02em] break-words"
        >
          {timetable.name}
        </h1>
        <div className="mt-[5px] flex flex-wrap items-center gap-[7px] text-[13px] text-ink-muted">
          {meta}
          <Dot />
          <span>
            Last Updated:{" "}
            <time
              dateTime={updated.toISOString()}
              title={formatTimestamp(updated)}
            >
              {formatRelative(updated, now ?? new Date())}
            </time>
          </span>
          {page === "view" && <TimetableStatusChip timetable={timetable} />}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {page === "edit" ? (
          <>
            <WarningsButton />
            <OrientationToggle />
            <CopyButton />
            <MoreMenu page="edit" layout="desktop" />
            <PublishButton layout="desktop" />
          </>
        ) : (
          <>
            <OrientationToggle />
            <CopyButton />
            {onExport && (
              <ExportButton
                status={exportStatus}
                onExport={onExport}
                layout="desktop"
              />
            )}
            <MoreMenu page="view" layout="desktop" />
          </>
        )}
      </div>
    </div>
  );
};

export default TimetableHeader;
