import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import { BookUp, Info, LogOut, Pencil, Plus } from "lucide-react";
import { z } from "zod";
import { userWithTimetablesType } from "../../../lib/src/index";
import { router } from "../main";
import { ModeToggle } from "./mode-toggle";

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

const userQueryOptions = queryOptions({
  queryKey: ["user"],
  queryFn: () => fetchUserDetails(),
});

export function NavBar() {
  const stateRouter = useRouter();
  const isCMSPage =
    stateRouter.state.resolvedLocation.pathname.includes("/cms");
  const isEditPage = stateRouter.state.resolvedLocation.pathname.includes(
    "/edit/" || "/finalize/",
  );

  const userQueryResult = useQuery(userQueryOptions);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () => {
      return axios.post<{ message: string; id: string }>(
        "/api/timetable/create",
      );
    },
    onSuccess: (_response) => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.navigate({
        to: "/edit/$timetableId",
        params: { timetableId: _response.data.id },
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

  const renderNavbarBasedOnQueryFetch = (
    userQueryResultData: typeof userQueryResult.data,
  ) => (
    <div className="flex flex-row w-full justify-between shadow-lg">
      <div className="flex items-center">
        <Link to={userQueryResultData ? "/" : undefined}>
          <div className="hidden md:flex">
            <h1 className="scroll-m-20 cursor-pointer text-2xl font-extrabold tracking-tight lg:text-3xl m-4 text-foreground">
              ChronoFactorem
            </h1>
          </div>
          <div className="flex md:hidden">
            <h1 className="scroll-m-20 cursor-pointer text-2xl font-extrabold tracking-tight lg:text-3xl mx-2 my-4 text-foreground">
              Chrono
            </h1>
          </div>
        </Link>
        {!isEditPage && (
          <Button
            className="text-green-200 w-fit text-xl p-4 ml-4 bg-green-900 hover:bg-green-800"
            onClick={
              userQueryResultData ? () => createMutation.mutate() : undefined
            }
          >
            <div className="hidden md:flex">Create a timetable</div>
            <div className="flex md:hidden">
              <Plus className="h-6 w-6" />
            </div>
          </Button>
        )}
        <Link
          // Comment out for now because the route doesn't exist
          // to={userQueryResultData ? "/about" : undefined}
          className="text-primary py-2 px-2 ml-2 text-lg rounded-full hover:bg-muted transition h-fit duration-200 ease-in-out"
        >
          <div className="hidden md:flex">About</div>
          <div className="flex md:hidden">
            <Info className="h-6 w-6" />
          </div>
        </Link>
        {!isCMSPage && (
          <Link
            to={userQueryResultData ? "/cmsExport" : undefined}
            className="text-primary py-2 px-2 ml-2 text-lg rounded-full hover:bg-muted transition h-fit whitespace-nowrap duration-200 ease-in-out"
          >
            <div className="hidden md:flex">CMS Auto-Enroll</div>
            <div className="flex md:hidden">
              <BookUp className="h-6 w-6" />
            </div>
          </Link>
        )}
      </div>
      <div className="flex flex-row">
        <div className="pt-3">
          <ModeToggle />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="rounded-full text-foreground bg-accent p-1 px-3 text-xl h-fit lg:mx-8 mx-2 mt-4">
              <span>
                {userQueryResultData ? userQueryResultData.name[0] : " "}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="lg:w-56 w-fit">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to={userQueryResultData ? "/editProfile" : undefined}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Edit Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="focus:bg-destructive/90 focus:text-destructive-foreground cursor-pointer"
            >
              <Link to={userQueryResultData ? "/login" : undefined}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
  if (userQueryResult.isFetching) {
    return renderNavbarBasedOnQueryFetch(undefined);
  }
  if (userQueryResult.isError) {
    return (
      <span>
        Unexpected error: {JSON.stringify(userQueryResult.error.message)} Please
        report this{" "}
        <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
          here
        </a>
      </span>
    );
  }
  if (userQueryResult.data === undefined) {
    return (
      <span>
        Unexpected error: userQueryResult.data is undefined. Please report this{" "}
        <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
          here
        </a>
      </span>
    );
  }
  return renderNavbarBasedOnQueryFetch(userQueryResult.data);
}
