import { useEffect, useRef, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useTimetableState } from "@/context";
import { useTimetableNav } from "@/lib/useTimetableNav";
import CDCList from "./CDCList";
import CourseSearchResults from "./CourseSearchResults";
import EditCoursesTab from "./EditCoursesTab";
import ExamTab from "./ExamTab";
import SideMenuTabs from "./SideMenuTabs";
import { Input } from "./ui/input";
import { Tabs, TabsContent } from "./ui/tabs";
import ViewCoursesTab from "./ViewCoursesTab";

export function SideMenu({
  isOnEditPage,
  isScreenshotMode,
}: {
  isOnEditPage: boolean;
  isScreenshotMode: boolean;
}) {
  const {
    state: { timetable, currentTab, searchTerm },
  } = useTimetableState();
  const { setTab, setQuery } = useTimetableNav();
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 500);
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

  // user is not in course details
  return (
    <div className="bg-secondary h-full min-h-0 w-full">
      <Tabs
        value={isScreenshotMode ? "exams" : currentTab}
        onValueChange={(tab) => setTab(tab as typeof currentTab)}
        className="flex h-full min-h-0 flex-col py-2"
      >
        {!isScreenshotMode && <SideMenuTabs isOnEditPage={isOnEditPage} />}
        <TabsContent
          value="cdcs"
          className="min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
        >
          <CDCList />
        </TabsContent>

        {isOnEditPage ? <EditCoursesTab /> : <ViewCoursesTab />}
        <ExamTab />

        <TabsContent
          value="search"
          className="min-h-0 flex-1 data-[state=inactive]:hidden"
        >
          <div className="px-4 pb-4">
            <Input
              value={draftTerm}
              onChange={(e) => setDraftTerm(e.target.value)}
              placeholder="Search Courses"
              className="text-md p-2"
            />
          </div>

          <CourseSearchResults debouncedSearchTerm={debouncedSearchTerm} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
