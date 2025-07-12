import { notFound, useParams } from "@tanstack/react-router";
import type React from "react";
import { createContext, useContext, useEffect, useReducer } from "react";
import Spinner from "@/components/Spinner";
import useCourse from "@/data-access/useCourse";
import useCourses from "@/data-access/useCourses";
import useTimetable from "@/data-access/useTimetable";
import useUser from "@/data-access/useUser";
import reducer from "./reducer";
import {
  type Action,
  TimetableActionType,
  type TimetableStateType,
} from "./types";

const initialTimetableState: TimetableStateType = {
  isVertical: false,
  isLoading: false,
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
  const [state, dispatch] = useReducer(reducer, initialTimetableState);
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: courses, isLoading: isCoursesLoading } = useCourses();
  const { data: timetable, isLoading: isTimetableLoading } =
    useTimetable(timetableId);
  const { data: course } = useCourse(state.currentCourseID);

  useEffect(() => {
    if (!courses || !timetable) return;
    dispatch({
      type: TimetableActionType.UpdateCoursesAndTimetable,
      courses,
      timetable,
    });
  }, [courses, timetable]);

  useEffect(() => {
    if (!user) return;
    dispatch({
      type: TimetableActionType.UpdateUser,
      user,
    });
  }, [user]);

  useEffect(() => {
    if (!course) return;
    dispatch({
      type: TimetableActionType.UpdateCourse,
      course,
    });
  }, [course]);

  if (isUserLoading || isCoursesLoading || isTimetableLoading) {
    return <Spinner />;
  }

  return (
    <TimetableState.Provider value={{ state, dispatch }}>
      {children}
    </TimetableState.Provider>
  );
};
