import { router } from "@/main";
import { useEffect, useRef, useState } from "react";
import { useToast } from "./ui/use-toast";

import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown, Search } from "lucide-react";
import { yearType } from '../../../lib/src/zodFieldTypes';

const SearchBar = () => {

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState<string | undefined>()
  const [year, setYear] = useState<string | undefined>()
  const [semester, setSemester] = useState<string | undefined>()

  const { toast } = useToast();
  const handleSearch = async (query: string | undefined, semester: string | undefined, year: string | undefined) => {
    if (query === undefined || query.length < 2) {
      toast({
        title: "Error",
        variant: "destructive",
        description: "Search query has to be atleast 2 characters long",
      });
      return;
    }
    const searchString = query + (semester ? `&semester=${semester}` : "") + (year ? `&year=${year}` : "");
    router.navigate({
      to: `/search/${searchString}`,
      params: { query },
    });
  };
  return (
    <div className="flex items-center w-full max-w-md gap-2 md:ml-10">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        type="search"
        placeholder="Search..."
        className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-10 px-4 flex items-center gap-2">
            <span>All</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>Year</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={year} onValueChange={(value) => setYear(value)}>
            <DropdownMenuRadioItem value="1">Year 1</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="2">Year 2</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="3">Year 3</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="4">Year 4</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="5">Year 4</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Semester</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={semester} onValueChange={(value) => setSemester(value)}>
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

