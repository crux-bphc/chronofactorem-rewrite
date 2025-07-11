import type { AxiosResponse } from "axios";
import ReportIssue from "@/components/ReportIssueToastAction";

const errorTitleMap = {
  400: "Error",
  403: "Error",
  404: "Error",
  500: "Server Error",
};

export const HTTPError = <T extends object, K>(
  response: AxiosResponse<T, K>,
  status: keyof typeof errorTitleMap | number,
) => {
  return {
    title: typeof status === "number" ? "Unknown Error" : errorTitleMap[status],
    description:
      "message" in response.data && typeof response.data.message === "string"
        ? response.data.message
        : `API returned ${response.status}`,
    variant: "destructive" as const,
    action: <ReportIssue />,
  };
};

export const UnknownError = () => {
  return {
    title: "Unknown Error",
    description: "An unknown error occurred.",
    variant: "destructive" as const,
    action: <ReportIssue />,
  };
};
