import { useQuery } from "@tanstack/react-query";
import type { courseWithSectionsType } from "lib";
import type z from "zod";
import chronoAPI from "../axios";

const fetchCourse = async (currentCourseID: string | null) => {
  if (currentCourseID === null) return null;
  const response = await chronoAPI.get<z.infer<typeof courseWithSectionsType>>(
    `/api/course/${currentCourseID}`,
  );
  return response.data;
};

const useCourse = (currentCourseID: string | null) =>
  useQuery({
    queryKey: [currentCourseID],
    queryFn: () => fetchCourse(currentCourseID),
  });

export default useCourse;
