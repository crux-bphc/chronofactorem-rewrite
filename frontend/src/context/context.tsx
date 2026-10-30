import { useQuery } from "@tanstack/react-query";
import { notFound, useParams } from "@tanstack/react-router";
import type React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import CenteredSpinner from "@/components/CenteredSpinner";
import useCourse from "@/data-access/hooks/useCourse";
import { courseQueryOptions } from "@/data-access/hooks/useCourses";
import useTimetable from "@/data-access/hooks/useTimetable";
import useUser from "@/data-access/hooks/useUser";
import {
  filterCoursesInTimetable,
  formatCDCWarningsAndOptions,
  getFilledTimetableSections,
} from "@/utils/timetable";
import reducer from "./reducer";
import {
  type Action,
  TimetableActionType,
  type TimetableStateType,
} from "./types";

const initialTimetableState: TimetableStateType = {
  isVertical: false,
  isCopyingTimetable: false,
  user: undefined,
  courses: undefined,
  timetable: undefined,
  coursesInTimetable: [],
  cdcs: [],
  currentCourseID: null,
  course: undefined,
  uniqueSectionTypes: [],
  currentSectionType: "L",
  currentTab: "CDCs",
  screenIsLarge: window.matchMedia("(min-width: 1024px)").matches,
  timetableDetailsSections: [],
  searchTerm: "",
};

type TimetableProviderType = {
  state: TimetableStateType;
  dispatch: React.Dispatch<Action>;
};

const TimetableState = createContext<TimetableProviderType>({
  state: initialTimetableState,
  dispatch: () => null,
});

export const useTimetableState = () => useContext(TimetableState);

export const TimetableProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { timetableId } = useParams({
    strict: false,
  });
  if (timetableId === undefined) throw notFound();
  return (
    <TimetableDataProvider key={timetableId} timetableId={timetableId}>
      {children}
    </TimetableDataProvider>
  );
};

const TimetableDataProvider = ({
  children,
  timetableId,
}: {
  children: React.ReactNode;
  timetableId: string;
}) => {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: timetable, isLoading: isTimetableLoading } =
    useTimetable(timetableId);
  // The course list must match the semester of the timetable being viewed
  // (archived timetables reference archived courses), so the query is gated
  // on the timetable being loaded.
  const { data: courses, isLoading: isCoursesLoading } = useQuery({
    ...courseQueryOptions(
      timetable === undefined
        ? undefined
        : { acadYear: timetable.acadYear, semester: timetable.semester },
    ),
    enabled: timetable !== undefined,
  });
  const [state, dispatch] = useReducer(reducer, {
    ...initialTimetableState,
    screenIsLarge: window.matchMedia("(min-width: 1024px)").matches,
    currentTab: timetable?.draft ? "CDCs" : "currentCourses",
  });
  const { data: course } = useCourse(state.currentCourseID);

  const value = useMemo(() => {
    const uniqueSectionTypes = course
      ? [...new Set(course.sections.map((section) => section.type))].sort()
      : [];
    return {
      state: {
        ...state,
        user,
        timetable,
        courses,
        course,
        uniqueSectionTypes,
        currentSectionType:
          state.currentSectionType ?? uniqueSectionTypes[0] ?? null,
        coursesInTimetable:
          courses && timetable
            ? filterCoursesInTimetable(courses, timetable)
            : [],
        timetableDetailsSections:
          courses && timetable
            ? getFilledTimetableSections(courses, timetable)
            : [],
        cdcs:
          courses && timetable
            ? formatCDCWarningsAndOptions(courses, timetable)
            : [],
      },
      dispatch,
    };
  }, [state, user, timetable, courses, course]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () =>
      dispatch({
        type: TimetableActionType.UpdateScreenIsLarge,
        screenIsLarge: media.matches,
      });
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  if (isUserLoading || isCoursesLoading || isTimetableLoading) {
    return <CenteredSpinner />;
  }

  return (
    <TimetableState.Provider value={value}>{children}</TimetableState.Provider>
  );
};
