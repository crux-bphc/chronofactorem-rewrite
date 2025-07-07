import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import { Info, LogOut, Pencil, Plus, Search } from "lucide-react";
import { useCookies } from "react-cookie";
import type { z } from "zod";
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
import type { userWithTimetablesType } from "../../../lib/src/index";
import { router } from "../main";
import Announcements from "./announcements";
import { ModeToggle } from "./mode-toggle";
import SearchBar from "./SearchBar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

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
  // const isCMSPage = stateRouter.state.resolvedLocation.pathname.includes("/CMS");
  const isEditPage =
    stateRouter.state.resolvedLocation?.pathname.includes("/edit/") ||
    stateRouter.state.resolvedLocation?.pathname.includes("/finalize/");

  const [_cookies, _setCookie, removeCookie] = useCookies(["session"]);
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

  const ChronoLogoText = (
    <>
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
    </>
  );

  const renderNavbarBasedOnQueryFetch = (
    userQueryResultData: typeof userQueryResult.data,
  ) => (
    <div className="flex flex-row w-full justify-between shadow-lg">
      <div className="flex items-center">
        {userQueryResultData ? (
          <Link to="/">{ChronoLogoText}</Link>
        ) : (
          ChronoLogoText
        )}
        {!isEditPage && (
          <Button
            className="text-green-200 w-fit text-xl px-2 md:px-4 py-4 md:ml-4 bg-green-900 hover:bg-green-800"
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
          to="/about"
          className="text-primary py-2 px-2 md:ml-2 text-lg rounded-full hover:bg-muted transition h-fit duration-200 ease-in-out"
        >
          <div className="hidden md:flex">About</div>
          <div className="flex md:hidden">
            <Info className="h-6 w-6" />
          </div>
        </Link>
        {/* {!isCMSPage && (
          <Link
            to={userQueryResultData ? "/CMSExport" : undefined}
            className="text-primary py-2 px-2 md:ml-2 text-lg rounded-full hover:bg-muted transition h-fit whitespace-nowrap duration-200 ease-in-out"
          >
            <div className="hidden md:flex">CMS Auto-Enroll</div>
            <div className="flex md:hidden">
              <BookUp className="h-6 w-6" />
            </div>
          </Link>
        )} */}
        <div className="hidden md:flex md:ml-4">
          <SearchBar />
        </div>
        <div className="text-primary py-3 px-2 md:ml-2 text-lg rounded-full hover:bg-muted transition h-fit duration-200 ease-in-out">
          <div className="flex md:hidden">
            <Popover>
              <PopoverTrigger asChild className="cursor-pointer">
                <Search />
              </PopoverTrigger>
              <PopoverContent className="w-80 mt-4 mr-8">
                <SearchBar />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="flex flex-row">
        <div className="flex pt-3">
          <Announcements />
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
              {userQueryResultData && (
                <Link to="/editProfile">
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Edit Profile</span>
                </Link>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="focus:bg-destructive/90 focus:text-destructive-foreground cursor-pointer"
              onClick={() => {
                const frontendIsHTTPS =
                  import.meta.env.VITE_FRONTEND_URL.includes("https://");
                removeCookie("session", {
                  path: "/",
                  domain: import.meta.env.VITE_FRONTEND_URL.replace(
                    frontendIsHTTPS ? "https://" : "http://",
                    "",
                  ),
                });
                router.navigate({
                  to: "/login",
                });
              }}
            >
              <div>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </div>
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
