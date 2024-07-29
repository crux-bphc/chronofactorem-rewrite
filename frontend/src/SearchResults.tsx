import { queryOptions, useQuery } from "@tanstack/react-query";
import { ErrorComponent, Route } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import type { z } from "zod";
import type { timetableWithSectionsType } from "../../lib/src";
import authenticatedRoute from "./AuthenticatedRoute";
import { ToastAction } from "./components/ui/toast";
import { useToast } from "./components/ui/use-toast";
import { router } from "./main";
import { useEffect } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
  // @ts-ignore Suppress unused variable warning, needs to be removed when the page is finished
  const searchQueryResult = useQuery(searchQueryOptions(query));

  useEffect(() => {
    console.log(searchQueryResult.data);
  }, [searchQueryResult]);

  return (
    <main className="text-foreground py-6 md:py-12 px-10 md:px-16">
      <h1 className="text-xl font-bold text-center sm:text-left md:text-4xl">
        Search Results
      </h1>
      <div className="my-10 flex flex-wrap gap-5">
        {
          searchQueryResult.data?.map((timetable) => {
            return (
              <Card key={timetable.id} className="w-md cursor-pointer" onClick={() => router.navigate({ to: `/view/${timetable.id}` })}>
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
                    {timetable.archived ? <Badge variant='destructive'>Archived</Badge> : null}
                  </div>
                </CardContent>
              </Card>
            );
          })
        }
      </div>


    </main>
  );
}

export default searchRoute;
