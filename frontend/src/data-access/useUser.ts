import { queryOptions, useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { timetableType, userWithTimetablesType } from "lib";
import type z from "zod";

type Timetable = z.infer<typeof timetableType>;
const filterTimetables = (timetables: Timetable[]) => {
  const publicTimetables: Timetable[] = [];
  const privateTimetables: Timetable[] = [];
  const draftTimetables: Timetable[] = [];
  const archivedTimetables: Timetable[] = [];

  for (const timetable of timetables) {
    if (timetable.archived) {
      archivedTimetables.push(timetable);
    } else if (timetable.draft) {
      draftTimetables.push(timetable);
    } else if (timetable.private) {
      privateTimetables.push(timetable);
    } else {
      publicTimetables.push(timetable);
    }
  }

  return {
    publicTimetables,
    privateTimetables,
    draftTimetables,
    archivedTimetables,
  };
};

const fetchUserDetails = async (): Promise<
  z.infer<typeof userWithTimetablesType>
> => {
  const response = await axios.get<z.infer<typeof userWithTimetablesType>>(
    "/api/user",
    {
      headers: {
        "Content-Type": "application/json ",
      },
    },
  );
  return response.data;
};

export const userQueryOptions = queryOptions({
  queryKey: ["user"],
  queryFn: () => fetchUserDetails(),
  select: (data) => {
    return { ...data, ...filterTimetables(data.timetables) };
  },
});

const useUser = () => useQuery(userQueryOptions);

export default useUser;
