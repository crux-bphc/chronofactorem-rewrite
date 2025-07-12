import { Route } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { handleLoginRedirect } from "@/data-access/errors/handlers";
import toastHandler from "@/data-access/errors/toastHandler";
import useSearchQuery, {
  searchQueryOptions,
} from "@/data-access/useSearchQuery";
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

const searchRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "/search",
  component: SearchResults,
  validateSearch: (search) => search,
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.ensureQueryData(searchQueryOptions(deps)),
  errorComponent: ({ error }) => {
    const { toast } = useToast();
    handleLoginRedirect(error);
    toastHandler(error, toast);
  },
});

function SearchResults() {
  const initDeps = searchRoute.useLoaderDeps();
  const [deps, setDeps] = useState(initDeps);
  const searchQueryResult = useSearchQuery(deps);

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
