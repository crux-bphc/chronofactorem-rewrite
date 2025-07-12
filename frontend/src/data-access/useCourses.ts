import { queryOptions, useQuery } from "@tanstack/react-query";
import type { courseType } from "lib";
import type z from "zod";
import chronoAPI from "./axios";

const fetchCourses = async () => {
  const response =
    await chronoAPI.get<z.infer<typeof courseType>[]>("/api/course");
  return response.data;
};

export const courseQueryOptions = queryOptions({
  queryKey: ["courses"],
  queryFn: () => fetchCourses(),
});

const useCourses = () => useQuery(courseQueryOptions);

export default useCourses;
