import { ArrowUpRight } from "lucide-react";
import { useTimetableState } from "@/context";
import { panelForward } from "@/lib/panelTransition";
import { titleCase } from "@/lib/titleCase";
import { useTimetableNav } from "@/lib/useTimetableNav";
import { useWarningsSummary } from "@/lib/useWarningsSummary";
import { cn } from "@/lib/utils";
import { cdcIssueUrl } from "@/utils/timetable";
import { Button } from "./ui/button";

const overline =
  "px-4 lg:px-0 pt-3 text-xs font-semibold normal-case tracking-[.07em] text-ink-muted";
const group =
  "mx-4 mt-2 lg:mx-0 rounded-xl border border-line bg-surface [&>*+*]:border-t [&>*+*]:border-line";
const row = "flex min-h-[60px] items-center gap-2.5 px-3.5 py-3";

function Open({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label={label}
      onClick={onClick}
      className="ml-auto"
    >
      <ArrowUpRight size={18} aria-hidden="true" />
    </Button>
  );
}

/**
 * Warning rows for the desktop warnings popover and the phone warnings sheet.
 * `onNavigate` lets the container close itself when a row opens a course.
 */
export function WarningsList({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  /** On the root, e.g. `[&_*]:lg:mx-0` to drop the row inset in a popover. */
  className?: string;
}) {
  const { missingSections, missingCdcs, notFound } = useWarningsSummary();
  const { openCourse, showTab } = useTimetableNav();
  const {
    state: { timetable },
  } = useTimetableState();

  const showSections = missingSections.length > 0;
  const showCdcs = missingCdcs.length > 0;
  const showNotFound = notFound.length > 0;
  if (!showSections && !showCdcs && !showNotFound) return null;

  const go = (fn: () => unknown) =>
    panelForward(() => {
      onNavigate?.();
      return fn();
    })();

  return (
    <div className={cn("flex flex-col pb-3 lg:pb-0", className)}>
      {showSections && (
        <div className={group}>
          {missingSections.flatMap(({ code, courseId, types }) =>
            types.map((type) => (
              <div key={`${code}${type}`} className={row}>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[15px] font-semibold text-ink">
                    {code}
                  </span>
                  <span className="text-[12.5px] text-ink-muted">
                    is missing a {type} section
                  </span>
                </span>
                {courseId && (
                  <Open
                    label={`Open ${code}`}
                    onClick={() => go(() => openCourse(courseId, type))}
                  />
                )}
              </div>
            )),
          )}
        </div>
      )}
      {showCdcs && (
        <>
          <div className={overline}>CDCs missing:</div>
          <div className={group}>
            {missingCdcs.map((e) => (
              <div key={e.courseId ?? e.code} className={row}>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[15px] font-semibold text-ink">
                    {e.code}
                  </span>
                  {e.name && (
                    <span className="text-[12.5px] text-ink-muted">
                      {titleCase(e.name)}
                    </span>
                  )}
                </span>
                <Open
                  label={`Open ${e.code}`}
                  onClick={() =>
                    go(() =>
                      e.courseId ? openCourse(e.courseId) : showTab("courses"),
                    )
                  }
                />
              </div>
            ))}
          </div>
        </>
      )}
      {showNotFound && (
        <>
          <div className="flex flex-col gap-0.5 px-4 pt-3 text-sm lg:px-0">
            <span className="font-bold text-ink">
              Chrono could not find some of your CDCs in the list of courses.
            </span>
            <span className="text-ink">
              Please{" "}
              <a
                href={
                  timetable
                    ? cdcIssueUrl(timetable, notFound)
                    : "https://github.com/crux-bphc/chronofactorem-rewrite/issues"
                }
                className="text-brand"
              >
                report this issue
              </a>
            </span>
          </div>
          <div className={group}>
            {notFound.map((w) => (
              <div key={w} className={`${row} text-sm text-ink-muted`}>
                {w}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default WarningsList;
