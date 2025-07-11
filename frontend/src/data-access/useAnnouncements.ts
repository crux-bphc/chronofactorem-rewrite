import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { announcementWithIDType } from "lib";
import type z from "zod";

const fetchAnnouncements = async (): Promise<
  z.infer<typeof announcementWithIDType>[]
> => {
  const response = await axios.get<z.infer<typeof announcementWithIDType>[]>(
    "/api/user/announcements",
  );
  return response.data;
};

const useAnnouncements = () =>
  useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
  });

export default useAnnouncements;
