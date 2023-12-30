import { ErrorComponent, Route } from "@tanstack/react-router";
import { rootRoute, router } from "./main";
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
// TODO: figure out why leaving out the `src` causes errors (mostly related to the whole CJS / ESM meme)
import { collegeYearType, userWithTimetablesType } from "../../lib/src";
import { ToastAction } from "@/components/ui/toast";
import axios, { AxiosError } from "axios";
import { useToast } from "@/components/ui/use-toast";
import { queryOptions, useMutation } from "@tanstack/react-query";

const fetchUserDetails = async (): Promise<
  z.infer<typeof userWithTimetablesType>
> => {
  const response = await axios.get<z.infer<typeof userWithTimetablesType>>(
    "/api/user",
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
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

const getDegreesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "getDegrees",
  validateSearch: z.object({ year: collegeYearType }),
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(userQueryOptions).catch((error) => {
      if (
        error instanceof AxiosError &&
        error.response &&
        error.response.status === 401
      ) {
        router.navigate({
          to: "/login",
        });
      }
    }),
  component: GetDegrees,
  errorComponent: ({ error }) => {
    const { toast } = useToast();

    if (error instanceof AxiosError) {
      if (error.response) {
        switch (error.response.status) {
          case 404:
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
            break;
          case 500:
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
            break;

          default:
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
      } else {
        // Fallback to the default ErrorComponent
        return <ErrorComponent error={error} />;
      }
    }
  },
});

function GetDegrees() {
  const { year } = getDegreesRoute.useSearch();
  const [firstDegree, setFirstDegree] = useState<string | null>(null);
  const [secondDegree, setSecondDegree] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (body: { degrees: (string | null)[] }) => {
      return axios.post("/api/auth/submit", body, {
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      router.navigate({ to: "/" });
    },
    onError: (error) => {
      const { toast } = useToast();
      if (error instanceof AxiosError && error.response) {
        if (error.response.status === 401) {
          router.navigate({ to: "/login" });
        } else if (error.response.status === 400) {
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

      mutation.mutate({ degrees });
    } else {
      alert("Select your degree!");
    }
  };

  return (
    <>
      <div className="flex bg-slate-950 h-screen w-full justify-center">
        <div className="flex flex-col items-center pt-48">
          <h1 className="scroll-m-20 text-xl tracking-tight lg:text-2xl text-slate-50 text-center mx-4">
            {`Select your degree${
              firstDegree?.includes("B") && year >= 2 ? "s" : ""
            } so we can help build your timetable:`}
          </h1>
          <div className="flex flex-col sm:flex-row gap-2">
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
                <SelectTrigger className="w-84 bg-slate-800 border-slate-700 focus:ring-slate-800 focus:ring-offset-slate-800 text-slate-50 mt-4">
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
