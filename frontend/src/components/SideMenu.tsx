import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTimetableState } from "@/context";
import { PANEL_VT_CLASS } from "@/lib/panelTransition";
import { useTimetableNav } from "@/lib/useTimetableNav";
import { cn } from "@/lib/utils";
import CourseSearchResults from "./CourseSearchResults";
import { CoursesTab } from "./CoursesTab";
import ExamTab from "./ExamTab";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

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
    <div className={cn("flex h-full min-h-0 flex-col", PANEL_VT_CLASS)}>
      {isOnEditPage && (
        <div className="relative mx-4 mt-2 mb-2.5 shrink-0 lg:mx-0">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
          />
          <Input
            type="search"
            aria-label="Search Courses"
            placeholder="Search Courses"
            value={draftTerm}
            onChange={(e) => setDraftTerm(e.target.value)}
            className="pl-10 text-base [&::-webkit-search-cancel-button]:appearance-none"
          />
        </div>
      )}
      {searching ? (
        <div className="min-h-0 flex-1">
          <CourseSearchResults query={searchTerm} />
        </div>
      ) : (
        <Tabs
          value={currentTab}
          onValueChange={(tab) => setTab(tab as typeof currentTab)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList
            aria-label="Timetable details"
            className="flex shrink-0 justify-start gap-5 px-4 lg:px-0"
          >
            <TabsTrigger value="courses" className="min-h-11 px-0 text-sm">
              Courses · {coursesInTimetable.length}
            </TabsTrigger>
            <TabsTrigger value="exams" className="min-h-11 px-0 text-sm">
              Exams
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="courses"
            className="mt-0 min-h-0 flex-1 overflow-y-auto"
          >
            <CoursesTab editable={isOnEditPage} />
          </TabsContent>
          <TabsContent
            value="exams"
            className="mt-0 min-h-0 flex-1 overflow-y-auto"
          >
            <ExamTab />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
