import { queryOptions } from "@tanstack/react-query";
import type { courseType } from "lib";
import type z from "zod";
import chronoAPI from "../axios";

type CourseFilters = {
  acadYear: number;
  semester: number;
};

const fetchCourses = async (filters?: CourseFilters) => {
  const response = await chronoAPI.get<z.infer<typeof courseType>[]>(
    "/api/course",
    { params: filters },
  );
  return response.data;
};

export const courseQueryOptions = (filters?: CourseFilters) =>
  queryOptions({
    queryKey: ["courses", filters ?? null],
    queryFn: () => fetchCourses(filters),
  });
