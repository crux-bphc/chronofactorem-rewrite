import { Route, useNavigate } from "@tanstack/react-router";
import { rootRoute } from "./main";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { z } from "zod";

const getDegreeSearchSchema = z.object({
  year: z.number().min(1).max(5).catch(1),
});

const getDegreesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "getDegrees",
  component: GetDegrees,
  validateSearch: getDegreeSearchSchema,
});

function GetDegrees() {
  const navigate = useNavigate({ from: "/getDegrees" });
  const { year } = getDegreesRoute.useSearch();
  const [firstDegree, setFirstDegree] = useState<string | null>(null);
  const [secondDegree, setSecondDegree] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (firstDegree) {
      if (firstDegree?.includes("B") && year >= 2 && secondDegree === null) {
        alert("Select your second degree!");
        return;
      }

      const degrees =
        firstDegree?.includes("B") && year >= 2
          ? secondDegree !== "A0"
            ? [firstDegree, secondDegree]
            : [firstDegree]
          : [firstDegree];

      const response = await fetch("/api/auth/submit", {
        method: "POST",
        body: JSON.stringify({
          degrees: degrees,
        }),
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        mode: "cors",
        credentials: "include",
      });

      const json = await response.json();

      if (response.status === 200) {
        navigate({ to: "/" });
      } else if (response.status === 401) {
        navigate({ to: "/login" });
      } else if (response.status === 400) {
        alert(`Error: ${json.message}`);
      } else if (response.status === 500) {
        alert(`Server error: ${json.message}`);
      } else {
        alert(`Server error: ${json.message}`);
      }
    } else {
      alert("Select your degree!");
    }
  };

  return (
    <>
      <div className="flex bg-slate-950 h-screen w-full justify-center">
        <div className="flex flex-col items-center pt-48">
          <h1 className="scroll-m-20 text-xl tracking-tight lg:text-2xl text-slate-50">
            {`Select your degree${
              firstDegree?.includes("B") && year >= 2 ? "s" : ""
            } so we can help build your timetable:`}
          </h1>
          <div className="flex">
            <Select onValueChange={setFirstDegree}>
              <SelectTrigger className="w-84 bg-slate-800 border-slate-700 focus:ring-slate-800 focus:ring-offset-slate-800 text-slate-50 mt-4">
                <SelectValue placeholder="Select a degree" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600 text-slate-50">
                <SelectGroup>
                  <SelectLabel>Single Degrees</SelectLabel>
                  <SelectItem value="A1">A1: B.E. Chemical</SelectItem>
                  <SelectItem value="A2">A2: B.E. Civil</SelectItem>
                  <SelectItem value="A3">
                    A3: B.E. Electrical & Electronics
                  </SelectItem>
                  <SelectItem value="A4">A4: B.E. Mechanical</SelectItem>
                  <SelectItem value="A5">A5: B. Pharmacy</SelectItem>
                  <SelectItem value="A7">A7: B.E. Computer Science</SelectItem>
                  <SelectItem value="A8">
                    A8: B.E. Electronics & Instrumentation
                  </SelectItem>
                  <SelectItem value="AA">
                    AA: B.E. Electronics & Communication
                  </SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Dual Degrees</SelectLabel>
                  <SelectItem value="B1">B1: M.Sc. Biology</SelectItem>
                  <SelectItem value="B2">B2: M.Sc. Chemistry</SelectItem>
                  <SelectItem value="B3">B3: M.Sc. Economics</SelectItem>
                  <SelectItem value="B4">B4: M.Sc. Mathematics</SelectItem>
                  <SelectItem value="B5">B5: M.Sc. Physics</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {firstDegree?.includes("B") && year >= 2 && (
              <Select onValueChange={setSecondDegree}>
                <SelectTrigger className="w-84 mx-4 bg-slate-800 border-slate-700 focus:ring-slate-800 focus:ring-offset-slate-800 text-slate-50 mt-4">
                  <SelectValue placeholder="Select a degree" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-slate-50">
                  <SelectGroup>
                    <SelectLabel>Single Degrees</SelectLabel>
                    {/* A0 is used for single degree MSc people since empty string denotes no selection */}
                    <SelectItem value="A0">
                      None (Single degree M.Sc.)
                    </SelectItem>
                    <SelectItem value="A1">A1: B.E. Chemical</SelectItem>
                    <SelectItem value="A2">A2: B.E. Civil</SelectItem>
                    <SelectItem value="A3">
                      A3: B.E. Electrical & Electronics
                    </SelectItem>
                    <SelectItem value="A4">A4: B.E. Mechanical</SelectItem>
                    <SelectItem value="A7">
                      A7: B.E. Computer Science
                    </SelectItem>
                    <SelectItem value="A8">
                      A8: B.E. Electronics & Instrumentation
                    </SelectItem>
                    <SelectItem value="AA">
                      AA: B.E. Electronics & Communication
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>
          <Button
            className="w-fit mt-6 bg-slate-800 font-bold hover:bg-slate-700 transition ease-in-out"
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </div>
      </div>
      <span className="fixed bottom-0 bg-slate-800 w-full text-center py-1 text-md lg:text-lg text-slate-400">
        Powered by CRUx: The Programming and Computing Club of BITS Hyderabad
      </span>
    </>
  );
}

export default getDegreesRoute;
