import { TimetableActionType, useTimetableState } from "@/context";
import { TabsList, TabsTrigger } from "./ui/tabs";

const SideMenuTabs = ({ isOnEditPage }: { isOnEditPage: boolean }) => {
  const { dispatch } = useTimetableState();
  return (
    <TabsList>
      {isOnEditPage && (
        <TabsTrigger
          className="text-lg font-bold"
          value="CDCs"
          onClick={() =>
            dispatch({
              type: TimetableActionType.SetMenuTab,
              tab: "CDCs",
            })
          }
        >
          CDCs
        </TabsTrigger>
      )}
      {isOnEditPage && (
        <TabsTrigger
          className="text-lg font-bold"
          value="search"
          onClick={() =>
            dispatch({
              type: TimetableActionType.SetMenuTab,
              tab: "search",
            })
          }
        >
          Search
        </TabsTrigger>
      )}

      <TabsTrigger
        className="text-lg font-bold"
        value="currentCourses"
        onClick={() =>
          dispatch({
            type: TimetableActionType.SetMenuTab,
            tab: "currentCourses",
          })
        }
      >
        Courses
      </TabsTrigger>
      <TabsTrigger
        className="text-lg font-bold"
        value="exams"
        onClick={() =>
          dispatch({
            type: TimetableActionType.SetMenuTab,
            tab: "exams",
          })
        }
      >
        Exams
      </TabsTrigger>
    </TabsList>
  );
};

export default SideMenuTabs;
