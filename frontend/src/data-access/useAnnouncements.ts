import { useQuery } from "@tanstack/react-query";
import type { announcementWithIDType } from "lib";
import type z from "zod";
import chronoAPI from "./axios";

const fetchAnnouncements = async (): Promise<
  z.infer<typeof announcementWithIDType>[]
> => {
  const response = await chronoAPI.get<
    z.infer<typeof announcementWithIDType>[]
  >("/api/user/announcements");
  return response.data;
};

const useAnnouncements = () =>
  useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
  });

export default useAnnouncements;
