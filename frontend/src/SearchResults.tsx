import { queryOptions, useQuery } from "@tanstack/react-query";
import { ErrorComponent, Route } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import type { z } from "zod";
import type { timetableWithSectionsType } from "../../lib/src";
import authenticatedRoute from "./AuthenticatedRoute";
import { ToastAction } from "./components/ui/toast";
import { useToast } from "./components/ui/use-toast";
import { router } from "./main";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const fetchSearchDetails = async (
  query: string,
): Promise<z.infer<typeof timetableWithSectionsType>[]> => {
  const response = await axios.get<z.infer<typeof timetableWithSectionsType>[]>(
    `/api/timetable/search?query=${query}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  return response.data;
};

const searchQueryOptions = (query: string) =>
  queryOptions({
    queryKey: ["search_timetables", query],
    queryFn: () => fetchSearchDetails(query),
  });

const searchRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "/search/$query",
  component: SearchResults,
  loader: ({ context: { queryClient }, params }) =>
    queryClient
      .ensureQueryData(searchQueryOptions(params.query))
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
  errorComponent: ({ error }) => {
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
        return <ErrorComponent error={error} />;
      }
    }
  },
});

function SearchResults() {
  const { query } = searchRoute.useParams();
  const searchQueryResult = useQuery(searchQueryOptions(query));

  return (
    <main className="text-foreground py-6 md:py-12 px-10 md:px-16">
      <h1 className="text-xl font-bold text-center sm:text-left md:text-4xl">
        Search Results
      </h1>
      <div className="my-10 grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-5">
        {searchQueryResult.data?.map((timetable) => {
          return (
            <Card
              key={timetable.id}
              className="w-md cursor-pointer"
              onClick={() => router.navigate({ to: `/view/${timetable.id}` })}
            >
              <CardHeader>
                <CardTitle>{timetable.name}</CardTitle>
                <CardDescription>By: {timetable.authorId}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge>Year {timetable.year}</Badge>
                  <Badge>Sem {timetable.semester}</Badge>
                  <Badge>{timetable.acadYear}</Badge>
                  <Badge>{timetable.degrees}</Badge>
                  {timetable.archived ? (
                    <Badge variant="destructive">Archived</Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {searchQueryResult.isFetching ? (
          <div className="w-md h-96 bg-background">
            <p className="text-center text-lg font-bold text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin" />
            </p>
          </div>
        ) : null}
        {searchQueryResult.data?.length === 0 ? (
          <div className="w-md h-96 bg-background">
            <p className="text-center text-lg font-bold text-muted-foreground">
              No results found
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default searchRoute;
