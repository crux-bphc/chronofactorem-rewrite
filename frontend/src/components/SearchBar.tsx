import { router } from "@/main";
import { ListFilter, Search } from "lucide-react";
import { useRef } from "react";
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
import { useToast } from "./ui/use-toast";

const SearchBar = () => {
  const { toast } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);
  const handleSearch = async (query: string | undefined) => {
    if (query === undefined || query.length < 2) {
      toast({
        title: "Error",
        description: "Search query has to be atleast 2 characters long",
      });
      return;
    }
    router.navigate({
      to: "/search/$query",
      params: { query },
    });
  };
  return (
    <div className="flex items-center gap-2">
      <div className="relative ml-auto flex-1 md:grow-0">
        <Input
          type="search"
          placeholder="Search Timetables..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
          ref={searchRef}
        />
        <Search
          className="absolute right-4 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer"
          onClick={() => handleSearch(searchRef.current?.value)}
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
