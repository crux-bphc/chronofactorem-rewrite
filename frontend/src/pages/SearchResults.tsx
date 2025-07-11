import { queryOptions, useQuery } from "@tanstack/react-query";
import { Route } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import type { timetableWithSectionsType } from "lib";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import type { z } from "zod";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import toastHandler from "@/data-access/errors/toastHandler";
import authenticatedRoute from "../AuthenticatedRoute";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "../components/ui/pagination";
import { useToast } from "../components/ui/use-toast";
import { router } from "../main";

const fetchSearchDetails = async (
  query: string,
): Promise<z.infer<typeof timetableWithSectionsType>[]> => {
  const response = await axios.get<z.infer<typeof timetableWithSectionsType>[]>(
    `/api/timetable/search?${query}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  return response.data;
};

// biome-ignore lint/suspicious/noExplicitAny: will need nontrivial fix and maybe some kind of update since that Route function signature is deprecated
const searchQueryOptions = (deps: Record<string, any>) => {
  for (const key of Object.keys(deps)) {
    if (deps[key] === undefined) delete deps[key];
  }
  const query = new URLSearchParams(deps).toString();
  return queryOptions({
    queryKey: ["search_timetables", query],
    queryFn: () => fetchSearchDetails(query),
  });
};

const searchRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "/search",
  component: SearchResults,
  validateSearch: (search) => search,
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    queryClient
      .ensureQueryData(searchQueryOptions(deps))
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
    toastHandler(error, toast);
  },
});

function SearchResults() {
  const initDeps = searchRoute.useLoaderDeps();
  const [deps, setDeps] = useState(initDeps);
  const searchQueryResult = useQuery(searchQueryOptions(deps));

  return (
    <main className="text-foreground py-6 md:py-12 px-10 md:px-16">
      <div className="w-full flex gap-2 justify-between items-center">
        <h1 className="text-xl font-bold text-center sm:text-left md:text-4xl">
          Search Results
        </h1>
        <div className="flex flex-col items-center">
          <h2 className="text-muted-foreground font-bold">
            Page {((deps.page as number) ?? 0) + 1}
          </h2>
          <Pagination className="w-fit mx-0 text-2xl text-foreground">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setDeps((deps) => ({
                      ...deps,
                      page: Math.max(
                        0,
                        ((deps.page as number | undefined) ?? 0) - 1,
                      ),
                    }))
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setDeps((deps) => ({
                      ...deps,
                      page: Math.min(
                        50,
                        ((deps.page as number | undefined) ?? 0) + 1,
                      ),
                    }))
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
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
                  <Badge>
                    {timetable.year}-{timetable.semester}
                  </Badge>
                  <Badge>
                    {timetable.acadYear}-
                    {(timetable.acadYear + 1).toString().substring(2)}
                  </Badge>
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
            <p className="text-lg font-bold text-muted-foreground">
              No results found
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default searchRoute;
