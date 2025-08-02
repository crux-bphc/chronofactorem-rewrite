import { queryOptions, useQuery } from "@tanstack/react-query";
import type { timetableWithSectionsType } from "lib";
import type z from "zod";
import chronoAPI from "../axios";

const fetchSearchDetails = async (
  query: string,
): Promise<z.infer<typeof timetableWithSectionsType>[]> => {
  const response = await chronoAPI.get<
    z.infer<typeof timetableWithSectionsType>[]
  >(`/api/timetable/search?${query}`);
  return response.data;
};

type DepsType = {
  [x: string]: unknown;
};
export const searchQueryOptions = (deps: DepsType) => {
  const filteredDeps = Object.keys(deps)
    .filter((key) => typeof deps[key] === "number")
    .map((key) => {
      return [key, deps[key] as string];
    });
  const query = new URLSearchParams(filteredDeps).toString();
  return queryOptions({
    queryKey: ["search_timetables", query],
    queryFn: () => fetchSearchDetails(query),
  });
};

const useSearchQuery = (deps: DepsType) => useQuery(searchQueryOptions(deps));

export default useSearchQuery;
