import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ErrorComponent, Route } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import { Clipboard, ClipboardCheck, Globe, Lock } from "lucide-react";
import { useRef, useState } from "react";
import type { z } from "zod";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { timetableWithSectionsType } from "../../lib/src";
import authenticatedRoute from "./AuthenticatedRoute";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { ToastAction } from "./components/ui/toast";
import { toast, useToast } from "./components/ui/use-toast";
import { router } from "./main";

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

const timetableQueryOptions = (timetableId: string) =>
  queryOptions({
    queryKey: ["timetable", timetableId],
    queryFn: () => fetchTimetable(timetableId),
  });

const finalizeTimetableRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "finalize/$timetableId",
  loader: ({ context: { queryClient }, params: { timetableId } }) =>
    queryClient
      .ensureQueryData(timetableQueryOptions(timetableId))
      .catch((error: Error) => {
        if (
          error instanceof AxiosError &&
          error.response &&
          error.response.status === 401
        ) {
          router.navigate({
            to: "/login",
          });
        }

        throw error;
      }),
  component: FinalizeTimetable,
  errorComponent: ({ error }: { error: unknown }) => {
    const { toast } = useToast();

    if (error instanceof AxiosError) {
      if (error.response) {
        switch (error.response.status) {
          case 404:
            toast({
              title: "Error",
              description:
                "message" in error.response.data
                  ? error.response.data.message
                  : "API returned 404",
              variant: "destructive",
              action: (
                <ToastAction altText="Report issue: https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                  <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                    Report
                  </a>
                </ToastAction>
              ),
            });
            break;
          case 500:
            toast({
              title: "Server Error",
              description:
                "message" in error.response.data
                  ? error.response.data.message
                  : "API returned 500",
              variant: "destructive",
              action: (
                <ToastAction altText="Report issue: https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                  <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                    Report
                  </a>
                </ToastAction>
              ),
            });
            break;

          default:
            toast({
              title: "Unknown Error",
              description:
                "message" in error.response.data
                  ? error.response.data.message
                  : `API returned ${error.response.status}`,
              variant: "destructive",
              action: (
                <ToastAction altText="Report issue: https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                  <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                    Report
                  </a>
                </ToastAction>
              ),
            });
        }
      } else {
        // Fallback to the default ErrorComponent
        return <ErrorComponent error={error} />;
      }
    }
  },
});

function FinalizeTimetable() {
  const headingOptions = [
    "Anything else?",
    "The final touch",
    "One last thing",
    "Almost there!",
  ];

  const [headingText] = useState(
    headingOptions[Math.floor(Math.random() * headingOptions.length)],
  );
  const [privateTimetable, setPrivate] = useState(false);
  const [copied, setCopied] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const { timetableId } = finalizeTimetableRoute.useParams();
  const timetableQueryResult = useQuery(timetableQueryOptions(timetableId));
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: (body: {
      name: string | undefined;
      isPrivate: boolean;
      isDraft: boolean;
    }) => {
      return axios.post(`/api/timetable/${timetableId}/edit`, body, {
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.navigate({
        to: "/",
        params: { timetableId: timetableId },
      });
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response) {
        if (error.response.status === 401) {
          router.navigate({ to: "/login" });
        }
        if (error.response.status === 400) {
          toast({
            title: "Error",
            description:
              "message" in error.response.data
                ? error.response.data.message
                : "API returned 400",
            variant: "destructive",
            action: (
              <ToastAction altText="Report issue: https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                  Report
                </a>
              </ToastAction>
            ),
          });
        } else if (error.response.status === 403) {
          toast({
            title: "Error",
            description:
              "message" in error.response.data
                ? error.response.data.message
                : "API returned 403",
            variant: "destructive",
            action: (
              <ToastAction altText="Report issue: https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                  Report
                </a>
              </ToastAction>
            ),
          });
        } else if (error.response.status === 404) {
          toast({
            title: "Error",
            description:
              "message" in error.response.data
                ? error.response.data.message
                : "API returned 404",
            variant: "destructive",
            action: (
              <ToastAction altText="Report issue: https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                  Report
                </a>
              </ToastAction>
            ),
          });
        } else if (error.response.status === 500) {
          toast({
            title: "Server Error",
            description:
              "message" in error.response.data
                ? error.response.data.message
                : "API returned 500",
            variant: "destructive",
            action: (
              <ToastAction altText="Report issue: https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                  Report
                </a>
              </ToastAction>
            ),
          });
        } else {
          toast({
            title: "Unknown Error",
            description:
              "message" in error.response.data
                ? error.response.data.message
                : `API returned ${error.response.status}`,
            variant: "destructive",
            action: (
              <ToastAction altText="Report issue: https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
                  Report
                </a>
              </ToastAction>
            ),
          });
        }
      }
    },
  });

  if (timetableQueryResult.isFetching) {
    return <span>Loading...</span>;
  }

  if (timetableQueryResult.isError || timetableQueryResult.data === undefined) {
    return (
      <span>
        Unexpected error:{" "}
        {JSON.stringify(
          timetableQueryResult.error
            ? timetableQueryResult.error.message
            : "timetable query result is undefined",
        )}{" "}
        Please report this{" "}
        <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
          <span className="text-blue-700 dark:text-blue-400">here</span>
        </a>
      </span>
    );
  }

  if (timetableQueryResult.data === undefined) {
    return (
      <span>
        Unexpected error: timetableQueryResult.data is undefined. Please report
        this{" "}
        <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
          <span className="text-blue-700 dark:text-blue-400">here</span>
        </a>
      </span>
    );
  }

  return (
    <div className="flex lg:pl-96 pl-12 text-foreground lg:pt-48 pt-40 w-full">
      <div className="flex flex-col w-full">
        <span className="text-5xl font-bold">{headingText}</span>
        <Label htmlFor="name" className="mt-8 mb-2 text-lg">
          Name
        </Label>
        <Input
          ref={nameInput}
          id="name"
          defaultValue={timetableQueryResult.data.name}
          placeholder="Timetable Name"
          className="text-xl lg:w-1/3 w-4/5 bg-muted ring-primary-foreground ring-offset-slate-700 border-slate-700"
        />
        <Label htmlFor="share" className="mt-4 mb-2 text-lg">
          Share your timetable
        </Label>
        <div className="flex items-center lg:w-1/3 w-4/5" id="share">
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Button
                  className="rounded-r-none rounded-l-lg bg-muted hover:bg-muted-foreground text-foreground px-4 mr-0"
                  onClick={() => setPrivate(!privateTimetable)}
                >
                  {privateTimetable ? <Lock /> : <Globe />}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-muted text-foreground border-primary-foreground">
                {privateTimetable
                  ? "Private (only people with the link can view)"
                  : "Public (anyone can view)"}
              </TooltipContent>
            </Tooltip>
            <Input
              disabled
              value={`${import.meta.env.VITE_FRONTEND_URL}/view/${timetableId}`}
              className="text-xl ml-0 rounded-none bg-muted ring-primary-foreground ring-offset-primary-foreground border-primary-foreground"
            />
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Button
                  className="rounded-l-none bg-green-700 hover:bg-green-600 text-green-100 rounded-r-lg px-4 mr-0"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${
                        import.meta.env.VITE_FRONTEND_URL
                      }/view/${timetableId}`,
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  }}
                >
                  {copied ? <ClipboardCheck /> : <Clipboard />}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-muted text-foreground border-primary-foreground">
                {copied ? "Copied!" : "Copy link to timetable"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button
          className="bg-green-700 hover:bg-green-600 w-1/3 mt-8 text-green-100 px-4 mr-0 text-lg font-bold"
          onClick={() =>
            submitMutation.mutate({
              name: nameInput.current?.value,
              isPrivate: privateTimetable,
              isDraft: false,
            })
          }
        >
          Finish
        </Button>
      </div>
    </div>
  );
}

export default finalizeTimetableRoute;
