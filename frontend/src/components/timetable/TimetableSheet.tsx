import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import WarningsList from "@/components/WarningsList";
import { useTimetableState } from "@/context";
import useCourse from "@/data-access/hooks/useCourse";
import { PANEL_VT_CLASS } from "@/lib/panelTransition";
import { useSkeletonFadeIn } from "@/lib/skeletonFade";
import { titleCase } from "@/lib/titleCase";
import { useIsDesktop } from "@/lib/useIsDesktop";
import { useTimetableNav } from "@/lib/useTimetableNav";
import { useWarningsSummary } from "@/lib/useWarningsSummary";
import { cn } from "@/lib/utils";

type UrlSheet = "courses" | "warnings";

/**
 * The phone's one bottom sheet. `?sheet=courses` shows the course list or
 * picker, `?sheet=warnings` the warning rows. Desktop shows neither (the
 * panel and the warnings popover cover them), and `announcements` belongs
 * to the root.
 */
export function TimetableSheet({ courses }: { courses: ReactNode }) {
  const isDesktop = useIsDesktop();
  if (isDesktop) return null;
  return <PhoneSheet courses={courses} />;
}

function PhoneSheet({ courses }: { courses: ReactNode }) {
  const { search, closeSheet, closeCourse } = useTimetableNav();
  const {
    state: { course, currentCourseID },
  } = useTimetableState();
  const summary = useWarningsSummary();
  const onEditPage = useLocation({
    select: (l) => l.pathname.startsWith("/edit/"),
  });
  // matches EditTimetable: an unknown course id shows the list instead
  const { isLoading: isCourseLoading } = useCourse(currentCourseID);
  const titleFadeIn = useSkeletonFadeIn(currentCourseID !== null && !course);

  const urlSheet: UrlSheet | null =
    search.sheet === "courses" || search.sheet === "warnings"
      ? search.sheet
      : null;

  // vaul closes itself (×, Esc, scrim, drag) before closeSheet()'s history
  // move lands. Until the URL drops `sheet`, keep it closed so it never
  // flashes back open, and only ask for one close.
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  if (urlSheet === null && closing) setClosing(false);
  useEffect(() => {
    if (urlSheet === null) closingRef.current = false;
  }, [urlSheet]);

  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    closeSheet();
  };

  const opener = useRef<HTMLElement | null>(null);

  // Keep the last sheet's content while it animates away.
  const [shown, setShown] = useState<UrlSheet>(urlSheet ?? "courses");
  if (urlSheet !== null && urlSheet !== shown) setShown(urlSheet);

  // Never show an empty warnings sheet (say, a stale link after fixing them).
  const emptyWarnings = urlSheet === "warnings" && summary.count === 0;
  // close() is guarded by a ref, so this asks once per stale warnings entry;
  // keep it out of the deps so it only re-runs when emptiness flips
  useEffect(() => {
    if (emptyWarnings) close();
  }, [emptyWarnings]);

  const open = urlSheet !== null && !closing && !emptyWarnings;

  const pickerOpen =
    shown === "courses" &&
    onEditPage &&
    currentCourseID !== null &&
    (isCourseLoading || course !== undefined);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <SheetContent
        full
        // vaul skips autofocus so the search box doesn't pop the keyboard,
        // but then focus stays behind the scrim and Tab walks out of the
        // sheet. Focus the sheet itself so the focus trap holds.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          opener.current = document.activeElement as HTMLElement | null;
          (e.currentTarget as HTMLElement | null)?.focus();
        }}
        // Escape in a filled search box clears it (SideMenu) rather than
        // closing the sheet; an empty box still closes it.
        onEscapeKeyDown={(e) => {
          const target = e.target;
          if (
            target instanceof HTMLInputElement &&
            target.type === "search" &&
            target.value !== ""
          )
            e.preventDefault();
        }}
        // The sheet opens from the URL, not a Radix trigger, so hand focus
        // back to whatever opened it.
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          if (opener.current?.isConnected) opener.current.focus();
          opener.current = null;
        }}
      >
        {shown === "warnings" ? (
          <SheetHeader
            // master's titles are long; wrap them instead of truncating
            title={
              <span className="block whitespace-normal leading-tight">
                {summary.title}
              </span>
            }
          />
        ) : pickerOpen ? (
          <SheetHeader
            // long names wrap to a second line rather than truncating
            title={
              course ? (
                <span
                  className={cn(
                    "line-clamp-2 whitespace-normal leading-tight",
                    titleFadeIn.className,
                  )}
                  onAnimationEnd={titleFadeIn.onAnimationEnd}
                >
                  {titleCase(course.name)}
                </span>
              ) : (
                <Skeleton className="h-5 w-24" />
              )
            }
            onBack={closeCourse}
          />
        ) : (
          <SheetHeader title="Courses and exams" />
        )}
        <div className="min-h-0 flex-1">
          {shown === "warnings" ? (
            <div
              className={cn(
                "h-full overflow-y-auto pb-[env(safe-area-inset-bottom)]",
                PANEL_VT_CLASS,
              )}
            >
              <WarningsList />
            </div>
          ) : (
            courses
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default TimetableSheet;
