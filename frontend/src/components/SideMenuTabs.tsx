import { TabsList, TabsTrigger } from "./ui/tabs";

const SideMenuTabs = ({ isOnEditPage }: { isOnEditPage: boolean }) => (
  <TabsList className="shrink-0 self-start" aria-label="Timetable details">
    {isOnEditPage && (
      <TabsTrigger className="text-lg font-bold" value="CDCs">
        CDCs
      </TabsTrigger>
    )}
    {isOnEditPage && (
      <TabsTrigger className="text-lg font-bold" value="search">
        Search
      </TabsTrigger>
    )}
    <TabsTrigger className="text-lg font-bold" value="currentCourses">
      Courses
    </TabsTrigger>
    <TabsTrigger className="text-lg font-bold" value="exams">
      Exams
    </TabsTrigger>
  </TabsList>
);
export default SideMenuTabs;
