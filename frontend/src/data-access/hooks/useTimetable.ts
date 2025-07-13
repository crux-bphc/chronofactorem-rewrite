import { queryOptions, useQuery } from "@tanstack/react-query";
import type { timetableWithSectionsType } from "lib";
import type z from "zod";
import chronoAPI from "../axios";

const fetchTimetable = async (timetableId: string) => {
  const response = await chronoAPI.get<
    z.infer<typeof timetableWithSectionsType>
  >(`/api/timetable/${timetableId}`);
  return response.data;
};

export const timetableQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["timetable", id],
    queryFn: () => fetchTimetable(id),
  });

const useTimetable = (id: string) => useQuery(timetableQueryOptions(id));

export default useTimetable;
