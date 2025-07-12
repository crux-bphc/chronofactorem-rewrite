import { Link, useRouter } from "@tanstack/react-router";
import { Info, LogOut, Pencil, Plus, Search } from "lucide-react";
import { useCookies } from "react-cookie";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useCreateTimetable from "@/data-access/useCreateTimetable";
import useUser from "@/data-access/useUser";
import { router } from "../main";
import Announcements from "./Announcements";
import { ModeToggle } from "./ModeToggle";
import ReportIssue from "./ReportIssue";
import SearchBar from "./SearchBar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export function NavBar() {
  const stateRouter = useRouter();
  const isEditPage =
    stateRouter.state.resolvedLocation?.pathname.includes("/edit/") ||
    stateRouter.state.resolvedLocation?.pathname.includes("/finalize/");

  const [_cookies, _setCookie, removeCookie] = useCookies(["session"]);
  const {
    data: user,
    error: userError,
    isError: isUserError,
    isFetching: isUserFetching,
  } = useUser();
  const { mutate: createTimetable } = useCreateTimetable();

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

  const renderNavbarBasedOnQueryFetch = (userQueryResultData: typeof user) => (
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
              userQueryResultData
                ? () =>
                    createTimetable(void null, {
                      onSuccess: (_response) => {
                        router.navigate({
                          to: "/edit/$timetableId",
                          params: { timetableId: _response.data.id },
                        });
                      },
                    })
                : undefined
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
                {userQueryResultData ? userQueryResultData.name[0] : "?"}
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
  if (isUserFetching) {
    return renderNavbarBasedOnQueryFetch(undefined);
  }
  if (isUserError || user === undefined) {
    return (
      <ReportIssue
        error={JSON.stringify(
          userError ? userError.message : "user query result is undefined",
        )}
      />
    );
  }
  return renderNavbarBasedOnQueryFetch(user);
}
