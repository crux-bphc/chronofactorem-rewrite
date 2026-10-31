import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTimetableState } from "@/context";
import { PANEL_VT_CLASS } from "@/lib/panelTransition";
import { useTimetableNav } from "@/lib/useTimetableNav";
import { cn } from "@/lib/utils";
import CourseSearchResults from "./CourseSearchResults";
import { CoursesTab } from "./CoursesTab";
import ExamTab from "./ExamTab";
import { Input } from "./ui/input";
import { Tabs } from "./ui/tabs";

export function SideMenu({
  isOnEditPage,
  isScreenshotMode,
}: {
  isOnEditPage: boolean;
  isScreenshotMode: boolean;
}) {
  const {
    state: { timetable, currentTab, searchTerm, coursesInTimetable },
  } = useTimetableState();
  const { setTab, setQuery } = useTimetableNav();
  // The input is edited locally; the URL (replace) follows after a short
  // delay so async router updates never fight the caret or IME.
  const [draftTerm, setDraftTerm] = useState(searchTerm);
  const lastSent = useRef(searchTerm);
  useEffect(() => {
    if (searchTerm !== lastSent.current) {
      lastSent.current = searchTerm;
      setDraftTerm(searchTerm);
    }
  }, [searchTerm]);
  useEffect(() => {
    if (draftTerm === lastSent.current) return;
    const id = setTimeout(() => {
      lastSent.current = draftTerm;
      setQuery(draftTerm);
    }, 200);
    return () => clearTimeout(id);
  }, [draftTerm, setQuery]);
  const inputRef = useRef<HTMLInputElement>(null);
  // Clearing skips the debounce so the normal list comes straight back.
  const clearSearch = () => {
    lastSent.current = "";
    setDraftTerm("");
    setQuery("");
    inputRef.current?.focus();
  };

  if (timetable === undefined) return;

  if (isScreenshotMode) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <ExamTab all />
      </div>
    );
  }

  // The view page has no search, so a stray ?q= is ignored there.
  const searching = isOnEditPage && searchTerm.trim() !== "";

  return (
    <div
      data-shot="side-menu"
      className={cn("flex h-full min-h-0 flex-col", PANEL_VT_CLASS)}
    >
      {isOnEditPage && (
        <div className="relative mx-4 mt-2 mb-2.5 shrink-0 lg:mx-0">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
          />
          <Input
            ref={inputRef}
            type="search"
            aria-label="Search Courses"
            placeholder="Search Courses"
            value={draftTerm}
            onChange={(e) => setDraftTerm(e.target.value)}
            // the phone sheet leaves Escape to us while there's text
            onKeyDown={(e) => {
              if (e.key === "Escape" && draftTerm !== "") {
                e.preventDefault();
                clearSearch();
              }
            }}
            className="pr-11 pl-10 text-base [&::-webkit-search-cancel-button]:appearance-none"
          />
          {draftTerm !== "" && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={clearSearch}
              className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-ink-muted transition-colors duration-(--d-1) after:absolute after:-inset-1.5 after:content-[''] hover:bg-sunk hover:text-ink focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
      {searching ? (
        <div className="min-h-0 flex-1">
          <CourseSearchResults query={searchTerm} />
        </div>
      ) : (
        <Tabs
          aria-label="Timetable details"
          value={currentTab}
          onValueChange={setTab}
          className="flex-1"
          listClassName="shrink-0 justify-start gap-5 px-4 lg:px-0"
          tabClassName="min-h-11 px-0 text-sm"
          tabs={[
            {
              value: "courses",
              label: `Courses · ${coursesInTimetable.length}`,
              content: <CoursesTab editable={isOnEditPage} />,
            },
            { value: "exams", label: "Exams", content: <ExamTab /> },
          ]}
        />
      )}
    </div>
  );
}
