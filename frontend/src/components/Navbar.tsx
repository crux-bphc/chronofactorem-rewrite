import { Link, useRouterState } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { Info, LogOut, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useCreateTimetable from "@/data-access/hooks/useCreateTimetable";
import useUser from "@/data-access/hooks/useUser";
import { router } from "../router";
import Announcements from "./Announcements";
import { ModeToggle } from "./ModeToggle";
import ReportIssue from "./ReportIssue";

export function NavBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isEditPage =
    pathname.includes("/edit/") || pathname.includes("/finalize/");

  const {
    data: user,
    error: userError,
    isError: isUserError,
    isFetching: isUserFetching,
  } = useUser();

  // a 401 here just means the visitor is logged out, not that something broke
  const isUnauthenticated =
    isUserError &&
    userError instanceof AxiosError &&
    userError.response?.status === 401;

  const { mutate: createTimetable } = useCreateTimetable();

  const renderNavbarBasedOnQueryFetch = (userQueryResultData: typeof user) => (
    <div className="flex flex-row w-full justify-between p-4">
      <div className="flex items-center md:gap-4 gap-3">
        {userQueryResultData ? (
          <Link to="/">
            <ChronoLogoText />
          </Link>
        ) : (
          <ChronoLogoText />
        )}
        {userQueryResultData && !isEditPage && (
          <Button
            className="text-green-200 not-md:h-fit w-fit text-xl px-2 md:px-4 bg-green-900 hover:bg-green-800"
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
        <Button variant="link" size="sm" className="text-lg" asChild>
          <Link to="/about">
            <div className="hidden md:flex">About</div>
            <div className="flex md:hidden">
              <Info className="size-4" />
            </div>
          </Link>
        </Button>
      </div>

      <div className="flex flex-row items-center md:gap-4 gap-2">
        {userQueryResultData ? (
          <>
            <Announcements />
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="rounded-full text-foreground bg-accent p-1 px-3 text-xl h-fit">
                  <span>{userQueryResultData.name[0]}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="lg:w-56 w-fit">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/editProfile">
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Edit Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="focus:bg-destructive/90 focus:text-destructive-foreground cursor-pointer"
                  onClick={() => {
                    // the backend clears the auth cookies and ends the logto sso session
                    window.location.href = "/api/auth/logout";
                  }}
                >
                  <div>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <ModeToggle />
            {isUnauthenticated && (
              <Link
                to="/login"
                className="text-primary text-lg p-2 rounded-full hover:bg-muted transition h-fit duration-200 ease-in-out"
              >
                Login
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
  if (isUserFetching) {
    return renderNavbarBasedOnQueryFetch(user);
  }
  if (isUserError && !isUnauthenticated) {
    return (
      <ReportIssue
        error={JSON.stringify(
          userError ? userError.message : "user query result is undefined",
        )}
      />
    );
  }
  // user is undefined here when the visitor is logged out, so the navbar
  // renders without the parts that need authentication
  return renderNavbarBasedOnQueryFetch(user);
}

function ChronoLogoText() {
  return (
    <h1 className="md:after:content-['Factorem'] scroll-m-20 cursor-pointer text-2xl mb-1 font-extrabold tracking-tighter md:tracking-tight lg:text-3xl text-foreground">
      Chrono
    </h1>
  );
}
