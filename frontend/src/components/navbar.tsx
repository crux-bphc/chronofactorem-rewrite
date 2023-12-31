import { queryOptions, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import axios  from "axios";
import { z } from "zod";
import { userWithTimetablesType } from "../../../lib";
import { router } from "../main";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

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
  const userQueryResult = useQuery(userQueryOptions);

  if (userQueryResult.isFetching) {
    return <span>Loading...</span>;
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

  return (
    <div className="flex w-full justify-between">
      <div className="flex items-center">
        <Link to="/">
          <h1 className="scroll-m-20 cursor-pointer text-2xl font-extrabold tracking-tight lg:text-3xl m-4 text-slate-50">
            Chronofactorem<sup>ᵝ</sup>
          </h1>
        </Link>
        <Button className="text-green-200 w-fit text-xl p-4 ml-4 bg-green-900 hover:bg-green-800">
          Create a timetable
        </Button>
        <a
          href="/about"
          className="text-slate-300 py-2 px-4 ml-4 text-lg rounded-full hover:bg-slate-800 transition h-fit duration-200 ease-in-out"
        >
          About
        </a>
        <a
          href="/cmsExport"
          className="text-slate-300 py-2 px-4 ml-4 text-lg rounded-full hover:bg-slate-800 transition h-fit duration-200 ease-in-out"
        >
          CMS Auto-Enroll
        </a>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="rounded-full text-slate-50 bg-slate-500 p-1 px-3 text-xl h-fit mx-8 mt-4">
            <span>{userQueryResult.data.name[0]}</span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-slate-800 text-slate-300 border-slate-700">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem
            className="focus:bg-red-700 focus:text-red-100 cursor-pointer"
            onClick={() => {
              fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/logout`, {
                method: "GET",
                headers: {
                  "Access-Control-Allow-Origin": "*",
                  "Content-Type": "application/json",
                },
                mode: "cors",
                credentials: "include",
              });
              router.navigate({ to: "/login" });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
