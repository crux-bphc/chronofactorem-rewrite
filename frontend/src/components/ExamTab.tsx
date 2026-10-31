import { Fragment, useMemo } from "react";
import { Segmented } from "@/components/ui/segmented";
import { useTimetableState } from "@/context";
import { formatDayHeading, formatRange } from "@/lib/formatTime";
import { titleCase } from "@/lib/titleCase";
import { useTimetableNav } from "@/lib/useTimetableNav";
import { cn } from "@/lib/utils";

type ExamKind = "midsem" | "compre";

const overline =
  "px-4 lg:px-0 text-xs font-semibold uppercase tracking-[.07em] text-ink-muted";
const group =
  "mx-4 mt-2 lg:mx-0 rounded-xl border border-line bg-surface [&>*+*]:border-t [&>*+*]:border-line [&>:first-child]:rounded-t-[calc(var(--radius-xl)-1px)] [&>:last-child]:rounded-b-[calc(var(--radius-xl)-1px)]";

const OPTIONS: { value: ExamKind; label: string }[] = [
  { value: "midsem", label: "Midsems" },
  { value: "compre", label: "Compres" },
];

type Exam = { code: string; start: Date; end: Date };

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function DayGroups({ kind }: { kind: ExamKind }) {
  const {
    state: { courses, timetable },
  } = useTimetableState();

  const days = useMemo(() => {
    const tag = kind === "midsem" ? "MIDSEM" : "COMPRE";
    const exams: Exam[] = (timetable?.examTimes ?? [])
      .map((e) => e.split("|"))
      .filter((p) => p[1] === tag)
      .map((p) => ({ code: p[0], start: new Date(p[2]), end: new Date(p[3]) }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    const out: { key: string; start: Date; exams: Exam[] }[] = [];
    for (const exam of exams) {
      const key = dayKey(exam.start);
      const last = out[out.length - 1];
      if (last && last.key === key) last.exams.push(exam);
      else out.push({ key, start: exam.start, exams: [exam] });
    }
    return out;
  }, [timetable, kind]);

  const nameOf = (code: string) => {
    const name = courses?.find((c) => c.code === code)?.name;
    return name ? titleCase(name) : undefined;
  };

  return (
    <>
      {days.map((day, i) => (
        <Fragment key={day.key}>
          <div className={cn(overline, i === 0 ? "mt-3" : "mt-[22px]")}>
            {formatDayHeading(day.start)}
          </div>
          <div className={group}>
            {day.exams.map((exam) => {
              const name = nameOf(exam.code);
              return (
                <div
                  key={exam.code}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="text-[15px] leading-snug font-semibold text-ink">
                      {name ?? exam.code}
                    </div>
                    {name && (
                      <div className="text-[12.5px] text-ink-muted">
                        {exam.code}
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-medium text-ink">
                    {formatRange(exam.start, exam.end)}
                  </span>
                </div>
              );
            })}
          </div>
        </Fragment>
      ))}
    </>
  );
}

const ExamTab = ({ all }: { all?: boolean }) => {
  const {
    state: { timetable },
  } = useTimetableState();
  const { search, setExam } = useTimetableNav();
  if (timetable === undefined) return;

  if (all) {
    return (
      <div className="flex flex-col pt-2 pb-6">
        {OPTIONS.map((o, i) => (
          <Fragment key={o.value}>
            <div className={cn(overline, i > 0 && "mt-[22px]")}>{o.label}</div>
            <DayGroups kind={o.value} />
          </Fragment>
        ))}
      </div>
    );
  }

  const kind: ExamKind = search.exam ?? "midsem";
  return (
    <div className="flex flex-col pt-2 pb-6">
      <Segmented
        aria-label="Exam type"
        className="mx-4 h-11 lg:mx-0 lg:h-10"
        value={kind}
        onValueChange={setExam}
        options={OPTIONS}
      />
      <DayGroups kind={kind} />
    </div>
  );
};

export default ExamTab;
