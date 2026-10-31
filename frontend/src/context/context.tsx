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
import useCourse from "@/data-access/hooks/useCourse";
import { courseQueryOptions } from "@/data-access/hooks/useCourses";
import useTimetable from "@/data-access/hooks/useTimetable";
import useUser from "@/data-access/hooks/useUser";
import { useTimetableNav } from "@/lib/useTimetableNav";
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
  type TimetableUIState,
} from "./types";

const initialTimetableState: TimetableUIState = {
  isVertical: false,
  isCopyingTimetable: false,
  screenIsLarge: false,
};

type TimetableProviderType = {
  state: TimetableStateType;
  dispatch: React.Dispatch<Action>;
};

const TimetableState = createContext<TimetableProviderType | undefined>(
  undefined,
);

export const useTimetableState = () => {
  const value = useContext(TimetableState);
  if (!value) throw new Error("Timetable state requires a TimetableProvider");
  return value;
};

export const TimetableProvider = ({
  children,
  fallback,
}: {
  children: React.ReactNode;
  /** Shown while data the route loader didn't wait for (the user) loads. */
  fallback: React.ReactNode;
}) => {
  const { timetableId } = useParams({
    strict: false,
  });
  if (timetableId === undefined) throw notFound();
  return (
    <TimetableDataProvider
      key={timetableId}
      timetableId={timetableId}
      fallback={fallback}
    >
      {children}
    </TimetableDataProvider>
  );
};

const TimetableDataProvider = ({
  children,
  timetableId,
  fallback,
}: {
  children: React.ReactNode;
  timetableId: string;
  fallback: React.ReactNode;
}) => {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: timetable, isLoading: isTimetableLoading } =
    useTimetable(timetableId);
  const { data: courses, isLoading: isCoursesLoading } = useQuery({
    ...courseQueryOptions(
      timetable === undefined
        ? undefined
        : { acadYear: timetable.acadYear, semester: timetable.semester },
    ),
    enabled: timetable !== undefined,
  });
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    (): TimetableUIState => ({
      ...initialTimetableState,
      screenIsLarge: window.matchMedia("(min-width: 1024px)").matches,
    }),
  );
  const { search } = useTimetableNav();
  const { data: course } = useCourse(search.course ?? null);

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
        currentCourseID: search.course ?? null,
        currentSectionType:
          search.type && uniqueSectionTypes.includes(search.type)
            ? search.type
            : (uniqueSectionTypes[0] ?? null),
        currentTab: search.tab ?? "courses",
        searchTerm: search.q ?? "",
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
  }, [state, search, user, timetable, courses, course]);

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
    return fallback;
  }

  return (
    <TimetableState.Provider value={value}>{children}</TimetableState.Provider>
  );
};
