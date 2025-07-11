import { queryOptions, useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { timetableWithSectionsType } from "lib";
import type z from "zod";

const fetchTimetable = async (timetableId: string) => {
  const response = await axios.get<z.infer<typeof timetableWithSectionsType>>(
    `/api/timetable/${timetableId}`,
    {
      headers: {
        "Content-Type": "application/json ",
      },
    },
  );
  return response.data;
};

export const timetableQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["timetable", id],
    queryFn: () => fetchTimetable(id),
  });

const useTimetable = (id: string) => useQuery(timetableQueryOptions(id));

export default useTimetable;
