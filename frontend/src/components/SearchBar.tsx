import { router } from "@/main";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search } from "lucide-react";

const SearchBar = () => {
  const [query, setQuery] = useState<string | undefined>();
  const [year, setYear] = useState<string | undefined>();
  const [semester, setSemester] = useState<string | undefined>();

  const handleSearch = async (
    query: string | undefined,
    semester: string | undefined,
    year: string | undefined,
  ) => {
    let searchString = `?${query ? `query=${query}&` : ""}${
      semester ? `semester=${semester}&` : ""
    }${year ? `year=${year}&` : ""}`;
    if (searchString.endsWith("&") || searchString.endsWith("?"))
      searchString = searchString.substring(0, searchString.length - 1);

    router.navigate({ to: "/" });
    setTimeout(
      () => router.navigate({ to: `/search${searchString}`, replace: true }),
      100,
    );
  };
  return (
    <div className="flex items-center w-full max-w-md gap-2 md:ml-10">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        type="search"
        placeholder="Search (optional)..."
        className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-10 px-4 flex items-center gap-2"
          >
            <span>Filters</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>Year</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={year}
            onValueChange={(value) => setYear(value)}
          >
            <DropdownMenuRadioItem value="1">Year 1</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="2">Year 2</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="3">Year 3</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="4">Year 4</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="5">Year 5</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Semester</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={semester}
            onValueChange={(value) => setSemester(value)}
          >
            <DropdownMenuRadioItem value="1">Sem 1</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="2">Sem 2</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button onClick={() => handleSearch(query, semester, year)} size="icon">
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SearchBar;
