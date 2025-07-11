import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { courseWithSectionsType } from "lib";
import type z from "zod";

const fetchCourse = async (currentCourseID: string | null) => {
  if (currentCourseID === null) return null;
  const response = await axios.get<z.infer<typeof courseWithSectionsType>>(
    `/api/course/${currentCourseID}`,
    {
      headers: {
        "Content-Type": "application/json ",
      },
    },
  );
  return response.data;
};

const useCourse = (currentCourseID: string | null) =>
  useQuery({
    queryKey: [currentCourseID],
    queryFn: () => fetchCourse(currentCourseID),
  });

export default useCourse;
