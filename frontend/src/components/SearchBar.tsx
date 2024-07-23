import { useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { ListFilter, Search } from "lucide-react";
import { useRef } from "react";
import { z } from "zod";
import { timetableWithSectionsType } from "../../../lib/src";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { ToastAction } from "./ui/toast";
import { useToast } from "./ui/use-toast";

const fetchSearchDetails = async (
  query: string,
): Promise<z.infer<typeof timetableWithSectionsType>[]> => {
  const response = await axios.get<z.infer<typeof timetableWithSectionsType>[]>(
    `/api/timetable/search?query=${query}`,
    {
      headers: {
        "Content-Type": "application/json ",
      },
    },
  );
  return response.data;
};

const SearchBar = () => {
  const { toast } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const handleSearch = async (query: string | undefined) => {
    if (query === undefined || query.length < 2) {
      toast({
        title: "Error",
        description: "Search query has to be atleast 2 characters long",
      });
      return;
    }
    try {
      const timetables = await queryClient.fetchQuery({
        queryKey: ["search_timetable"],
        queryFn: () => fetchSearchDetails(query),
      });
      localStorage.setItem("timetable_search", JSON.stringify(timetables));
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        toast({
          title: "Server Error",
          description: `${error.response.data.message}`,
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
  };
  return (
    <div className="flex items-center gap-2">
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search
          className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer"
          onClick={() => handleSearch(searchRef.current?.value)}
        />

        <Input
          type="search"
          placeholder="Search Timetables..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
          ref={searchRef}
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1 hidden">
            <ListFilter className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Filter
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border border-slate-900 p-1 bg-slate-950 mt-2 rounded-sm"
        >
          <DropdownMenuLabel>Filter by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked>Course</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Name</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Archived</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SearchBar;
