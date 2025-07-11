import { TabsList, TabsTrigger } from "./ui/tabs";

const SideMenuTabs = ({
  isOnEditPage,
  setCurrentTab,
}: {
  isOnEditPage: boolean;
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
}) => (
  <TabsList>
    {isOnEditPage && (
      <TabsTrigger
        className="text-lg font-bold"
        value="CDCs"
        onClick={() => setCurrentTab("CDCs")}
      >
        CDCs
      </TabsTrigger>
    )}
    {isOnEditPage && (
      <TabsTrigger
        className="text-lg font-bold"
        value="search"
        onClick={() => setCurrentTab("search")}
      >
        Search
      </TabsTrigger>
    )}

    <TabsTrigger
      className="text-lg font-bold"
      value="currentCourses"
      onClick={() => setCurrentTab("currentCourses")}
    >
      Courses
    </TabsTrigger>
    <TabsTrigger
      className="text-lg font-bold"
      value="exams"
      onClick={() => setCurrentTab("exams")}
    >
      Exams
    </TabsTrigger>
  </TabsList>
);

export default SideMenuTabs;
