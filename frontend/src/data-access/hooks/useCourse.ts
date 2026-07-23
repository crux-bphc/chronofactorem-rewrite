import { queryOptions, useQuery } from "@tanstack/react-query";
import type { courseWithSectionsType } from "lib";
import type z from "zod";
import chronoAPI from "../axios";

const fetchCourse = async (currentCourseID: string) => {
  const response = await chronoAPI.get<z.infer<typeof courseWithSectionsType>>(
    `/api/course/${currentCourseID}`,
  );
  return response.data;
};

export const courseByIdQueryOptions = (currentCourseID: string | null) =>
  queryOptions({
    queryKey: ["course", currentCourseID],
    queryFn: () => fetchCourse(currentCourseID as string),
    enabled: currentCourseID !== null,
  });

const useCourse = (currentCourseID: string | null) =>
  useQuery(courseByIdQueryOptions(currentCourseID));

export default useCourse;
