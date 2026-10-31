import { toBlob } from "html-to-image";
import { useCallback, useEffect, useRef, useState } from "react";
import ReportIssueToastAction from "@/components/ReportIssueToastAction";
import { TimetableSurface } from "@/components/timetable/TimetableSurface";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { useTimetableState } from "@/context";
import { formatExamRange } from "@/utils/timeFormat";
import { timetableMeta } from "@/utils/timetable";
import { titleCase } from "@/utils/timetableGrid";
import { useOrientation } from "./useOrientation";

export type ExportStatus = "idle" | "rendering" | "done";

const DONE_MS = 1200;

let styleProperties: string[] | undefined;

/**
 * html-to-image copies every computed property (~530) onto every cloned node,
 * which blocks the main thread for half a second. Only properties some rule or
 * inline style declares can differ from what the clone gets by default, so
 * copying just those draws the same image. Custom properties are already
 * resolved into the computed values, and a still image has no animations or
 * transitions. Read once: html-to-image caches the list it is given anyway.
 */
function declaredStyleProperties(node: HTMLElement): string[] {
  if (styleProperties) return styleProperties;
  const declared = new Set<string>();
  const add = (style: CSSStyleDeclaration) => {
    for (let i = 0; i < style.length; i++) declared.add(style[i]);
  };
  const visit = (rules: CSSRuleList) => {
    for (const rule of rules) {
      if ("style" in rule && rule.style instanceof CSSStyleDeclaration)
        add(rule.style);
      if ("cssRules" in rule && rule.cssRules instanceof CSSRuleList)
        visit(rule.cssRules);
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      visit(sheet.cssRules);
    } catch {
      // a cross-origin sheet can't be read; html-to-image skips it too
    }
  }
  for (const el of node.querySelectorAll<HTMLElement>("[style]")) add(el.style);
  styleProperties = Array.from(
    getComputedStyle(document.documentElement),
  ).filter(
    (name) => declared.has(name) && !/^(--|animation-|transition-)/.test(name),
  );
  return styleProperties;
}

function ExamList({
  title,
  kind,
}: {
  title: string;
  kind: "MIDSEM" | "COMPRE";
}) {
  const {
    state: { timetable, coursesInTimetable },
  } = useTimetableState();
  if (timetable === undefined) return null;
  const nameOf = (code: string) =>
    coursesInTimetable.find((c) => c?.code === code)?.name;
  const exams = timetable.examTimes
    .filter((e) => e.includes(`|${kind}|`))
    .map((e) => {
      const parts = e.split("|");
      return { code: parts[0], start: parts[2], end: parts[3] };
    })
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  return (
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <ul className="mt-2 flex flex-col gap-1.5">
        {exams.map((exam) => (
          <li key={exam.code} className="flex gap-3 text-sm">
            <span className="w-72 shrink-0 truncate">
              <span className="font-semibold">
                {titleCase(nameOf(exam.code) ?? exam.code)}
              </span>
              {nameOf(exam.code) && (
                <span className="text-ink-muted">{` · ${exam.code}`}</span>
              )}
            </span>
            <span className="text-ink-muted">
              {formatExamRange(new Date(exam.start), new Date(exam.end))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Exports the timetable as a 2880px wide PNG. The image is drawn from its own
 * offscreen desktop-width frame, so it never depends on the live page's
 * viewport, view, now-line or hover state.
 */
export function useTimetableExport(): {
  status: ExportStatus;
  exportPng(): Promise<void>;
  exportElement: React.ReactNode;
} {
  const {
    state: { timetable, coursesInTimetable, timetableDetailsSections },
  } = useTimetableState();
  const { orientation } = useOrientation();
  const [status, setStatus] = useState<ExportStatus>("idle");
  const busy = useRef(false);
  const frame = useRef<HTMLDivElement>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(doneTimer.current), []);

  const exportPng = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    clearTimeout(doneTimer.current);
    setStatus("rendering");
    try {
      // wait for the offscreen frame to mount and lay out
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      await document.fonts.ready;
      const node = frame.current;
      if (!node)
        throw new Error(
          "The timetable image could not be prepared. Please try again.",
        );
      // toBlob encodes the PNG off the main thread, unlike toPng's toDataURL
      const blob = await toBlob(node, {
        pixelRatio: 2,
        cacheBust: true,
        style: { position: "static" },
        includeStyleProperties: declaredStyleProperties(node),
      });
      if (!blob)
        throw new Error(
          "The timetable image could not be prepared. Please try again.",
        );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "timetable.png";
      link.href = url;
      link.click();
      // Safari and Firefox read the blob after click() returns; revoking on the
      // next tick can cancel the download, so give it time (as FileSaver does)
      setTimeout(() => URL.revokeObjectURL(url), 40_000);
      // the "done" window is feedback only; a new export may start in it
      busy.current = false;
      setStatus("done");
      doneTimer.current = setTimeout(() => {
        setStatus("idle");
      }, DONE_MS);
    } catch (error) {
      busy.current = false;
      setStatus("idle");
      toast({
        title: "Could not export timetable",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
        action: <ReportIssueToastAction />,
      });
    }
  }, []);

  const exportElement =
    status === "rendering" && timetable !== undefined ? (
      <TooltipProvider>
        <div
          aria-hidden="true"
          ref={frame}
          className="pointer-events-none fixed left-[-10000px] top-0 w-[1440px] bg-bg px-10 pt-9 pb-10 text-ink"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-semibold">{timetable.name}</h2>
              <p className="mt-1 text-sm text-ink-muted">
                {timetableMeta(timetable).join(" · ")}
              </p>
            </div>
          </div>
          <div className={`mt-5 ${orientation === "rows" ? "h-[700px]" : ""}`}>
            <TimetableSurface
              sections={timetableDetailsSections}
              layout="desktop"
              view="week"
              day={0}
              orientation={orientation}
              mode="export"
            />
          </div>
          <div className="mt-6 grid grid-cols-[1fr_1fr] gap-10">
            <ul className="flex flex-col gap-2">
              {coursesInTimetable.map((course) =>
                course === undefined ? null : (
                  <li
                    key={course.id}
                    className="rounded-md border border-line bg-surface px-3 py-2"
                  >
                    <div className="text-sm">
                      <span className="font-semibold">
                        {titleCase(course.name)}
                      </span>
                      <span className="text-ink-muted">{` · ${course.code}`}</span>
                    </div>
                    <div className="text-xs text-ink-faint">
                      {timetable.sections
                        .filter((s) => s.courseId === course.id)
                        .map((s) => `${s.type}${s.number}`)
                        .sort()
                        .join(", ")}
                    </div>
                  </li>
                ),
              )}
            </ul>
            <div className="flex flex-col gap-6">
              <ExamList title="Midsems" kind="MIDSEM" />
              <ExamList title="Compres" kind="COMPRE" />
            </div>
          </div>
          <p className="mt-6 text-sm text-ink-faint">
            Made with ChronoFactorem
          </p>
        </div>
      </TooltipProvider>
    ) : null;

  return { status, exportPng, exportElement };
}
