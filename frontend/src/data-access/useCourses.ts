import { queryOptions, useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { courseType } from "lib";
import type z from "zod";

const fetchCourses = async () => {
  const response = await axios.get<z.infer<typeof courseType>[]>(
    "/api/course",
    {
      headers: {
        "Content-Type": "application/json ",
      },
    },
  );
  return response.data;
};

export const courseQueryOptions = queryOptions({
  queryKey: ["courses"],
  queryFn: () => fetchCourses(),
});

const useCourses = () => useQuery(courseQueryOptions);

export default useCourses;
