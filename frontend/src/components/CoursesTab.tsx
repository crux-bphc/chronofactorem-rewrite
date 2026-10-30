import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTimetableState } from "@/context";
import { panelForward } from "@/lib/panelTransition";
import { useTimetableNav } from "@/lib/useTimetableNav";
import { cn } from "@/lib/utils";
import { getRemainingCdcs } from "@/utils/timetable";
import { CourseRow, OptionalSet } from "./CourseRow";
import { Collapse } from "./ui/collapse";

type ListMemory = {
  added: Set<string>;
  // course id -> the row's top offset within the list
  remaining: Map<string, number>;
  sets: Set<string>;
};

// What each timetable's list looked like when it was last on screen, so a
// course added from the picker can move from Remaining into Added on return.
const listMemory = new Map<string, ListMemory>();

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const overline =
  "px-4 lg:px-0 text-xs font-semibold uppercase tracking-[.07em] text-ink-muted";
const group =
  "mx-4 mt-2 lg:mx-0 rounded-xl border border-line bg-surface [&>*+*]:border-t [&>*+*]:border-line [&>:first-child]:rounded-t-[calc(var(--radius-xl)-1px)] [&>:last-child]:rounded-b-[calc(var(--radius-xl)-1px)]";

const topIn = (el: Element, list: Element) =>
  el.getBoundingClientRect().top - list.getBoundingClientRect().top;

export function CoursesTab({ editable }: { editable: boolean }) {
  const {
    state: { timetable, coursesInTimetable, cdcs },
  } = useTimetableState();
  const { openCourse } = useTimetableNav();
  const timetableId = timetable?.id ?? "";

  const remaining = useMemo(
    () => (editable ? getRemainingCdcs(cdcs, coursesInTimetable) : []),
    [editable, cdcs, coursesInTimetable],
  );
  // Every remaining entry as if nothing were added, to keep CDC order for
  // sets that are collapsing away.
  const allEntries = useMemo(
    () => (editable ? getRemainingCdcs(cdcs, []) : []),
    [editable, cdcs],
  );

  const [prev] = useState(() => listMemory.get(timetableId));
  // Sets satisfied while the list was away play their collapse once.
  const [exiting, setExiting] = useState<Set<string>>(() => {
    if (!prev || reducedMotion()) return new Set();
    const now = new Set(
      remaining.flatMap((e) => (e.kind === "set" ? [e.key] : [])),
    );
    return new Set([...prev.sets].filter((key) => !now.has(key)));
  });

  const listRef = useRef<HTMLDivElement>(null);
  const addedRef = useRef<HTMLDivElement>(null);
  const remainingRef = useRef<HTMLDivElement>(null);

  // Courses that moved from Remaining into Added since last time slide up.
  // Runs on mount only: it compares against the list as it was last shown.
  useLayoutEffect(() => {
    const list = listRef.current;
    const addedGroup = addedRef.current;
    if (!prev || !list || !addedGroup || reducedMotion()) return;
    for (const course of coursesInTimetable) {
      const from = prev.remaining.get(course.id);
      if (from === undefined || prev.added.has(course.id)) continue;
      const row = addedGroup.querySelector<HTMLElement>(
        `[data-course-id="${CSS.escape(course.id)}"]`,
      );
      if (!row) continue;
      const dy = from - topIn(row, list);
      if (dy === 0) continue;
      // Opaque and on top while it slides over the rows in between.
      row.style.position = "relative";
      row.style.zIndex = "1";
      row.style.transition = "none";
      row.style.background = "var(--surface)";
      const anim = row.animate(
        [{ transform: `translateY(${dy}px)` }, { transform: "none" }],
        { duration: 300, easing: "cubic-bezier(.2,0,0,1)" },
      );
      const reset = () => {
        row.style.position = "";
        row.style.zIndex = "";
        row.style.background = "";
        row.style.transition = "";
      };
      anim.onfinish = reset;
      anim.oncancel = reset;
    }
  }, []);

  useLayoutEffect(() => {
    const save = () => {
      const list = listRef.current;
      if (!timetableId || !list?.isConnected) return;
      const offsets = new Map<string, number>();
      const group = remainingRef.current;
      for (const entry of remaining) {
        const ids =
          entry.kind === "course"
            ? [entry.course.id]
            : entry.options.map((o) => o.id);
        for (const id of ids) {
          const row = group?.querySelector(
            `[data-course-id="${CSS.escape(id)}"]`,
          );
          if (row) offsets.set(id, topIn(row, list));
        }
      }
      listMemory.set(timetableId, {
        added: new Set(coursesInTimetable.map((c) => c.id)),
        remaining: offsets,
        sets: new Set(
          remaining.flatMap((e) => (e.kind === "set" ? [e.key] : [])),
        ),
      });
    };
    save();
    return save;
  });

  if (timetable === undefined) return null;

  const pillsFor = (courseId: string) =>
    timetable.sections
      .filter((s) => s.courseId === courseId)
      .map((s) => `${s.type}${s.number}`)
      .sort();

  const live = new Set(
    remaining.map((e) => (e.kind === "set" ? e.key : e.course.id)),
  );
  const shown = allEntries.filter((e) =>
    e.kind === "set"
      ? live.has(e.key) || exiting.has(e.key)
      : live.has(e.course.id),
  );

  return (
    <div ref={listRef} className="flex flex-col pt-2 pb-6">
      <div className={overline}>Added · {coursesInTimetable.length}</div>
      {coursesInTimetable.length > 0 && (
        <div ref={addedRef} className={group}>
          {coursesInTimetable.map((course) => (
            <CourseRow
              key={course.id}
              course={course}
              pills={pillsFor(course.id)}
              onOpen={
                editable ? panelForward(() => openCourse(course.id)) : undefined
              }
            />
          ))}
        </div>
      )}
      {editable && shown.length > 0 && (
        <>
          <div className={cn(overline, "mt-[22px]")}>
            Remaining CDCs · {timetable.year}-{timetable.semester}
          </div>
          <div ref={remainingRef} className={group}>
            {shown.map((entry) => {
              if (entry.kind === "course") {
                return (
                  <CourseRow
                    key={`course:${entry.course.id}`}
                    course={entry.course}
                    onOpen={panelForward(() => openCourse(entry.course.id))}
                  />
                );
              }
              if (live.has(entry.key)) {
                return (
                  <OptionalSet
                    key={`set:${entry.key}`}
                    options={entry.options}
                  />
                );
              }
              return (
                <Collapse
                  key={`exit:${entry.key}`}
                  open={false}
                  appearOpen
                  onExited={() =>
                    setExiting((s) => {
                      const next = new Set(s);
                      next.delete(entry.key);
                      return next;
                    })
                  }
                >
                  <OptionalSet options={entry.options} />
                </Collapse>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default CoursesTab;
