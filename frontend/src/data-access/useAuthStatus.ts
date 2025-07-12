import { queryOptions } from "@tanstack/react-query";
import chronoAPI from "./axios";

type userAuthStatusType = {
  message: string;
  redirect?: string;
  error?: string;
};

const fetchUserAuthStatus = async (): Promise<userAuthStatusType> => {
  const response = await chronoAPI.get("/api/auth/check");
  return response.data;
};

export const authStatusQueryOptions = queryOptions({
  queryKey: ["authStatusCheck"],
  queryFn: () => fetchUserAuthStatus(),
});
