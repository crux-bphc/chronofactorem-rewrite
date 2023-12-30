import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToastAction } from "@/components/ui/toast";
import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { ErrorComponent, Route } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import { useState } from "react";
import { z } from "zod";
import { userWithTimetablesType } from "../../lib";
import { useToast } from "./components/ui/use-toast";
import { rootRoute, router } from "./main";

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

const editUserProfileRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "editProfile",
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
  component: EditUserProfile,
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

function EditUserProfile() {
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

  const [firstDegree, setFirstDegree] = useState<string>(
    userQueryResult.data.degrees[0],
  );
  const [secondDegree, setSecondDegree] = useState<string | null>(
    userQueryResult.data.degrees.length > 1
      ? userQueryResult.data.degrees[1]
      : null,
  );

  let batch;
  if (userQueryResult.data.email !== undefined) {
    batch = userQueryResult.data.email.match(
      /^f\d{8}@hyderabad\.bits-pilani\.ac\.in$/,
    )
      ? userQueryResult.data.email.slice(1, 5)
      : "0000";
  } else {
    batch = "0000";
  }

  const mutation = useMutation({
    mutationFn: (body: { degrees: (string | null)[] }) => {
      return axios.post("/api/user/edit", body, {
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      router.navigate({ to: "/" });
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response) {
        if (error.response.status === 401) {
          router.navigate({ to: "/login" });
        } else if (error.response.status === 400) {
          alert(`Error: ${error.message}`);
        } else if (error.response.status === 500) {
          alert(`Server error: ${error.message}`);
        } else {
          alert(`Server error: ${error.message}`);
        }
      }
    },
  });

  const handleSubmit = async () => {
    if (firstDegree.includes("B") && secondDegree === null) {
      alert("Select your second degree!");
      return;
    }

    const degrees = firstDegree.includes("B")
      ? secondDegree !== null
        ? secondDegree !== "A0"
          ? [firstDegree, secondDegree]
          : [firstDegree]
        : [firstDegree]
      : [firstDegree];

    mutation.mutate({ degrees });
  };

  return (
    <>
      <div className="flex bg-slate-950 h-screen w-full justify-start">
        <div className="flex flex-col lg:pt-28 pt-20 lg:mx-60 mx-12">
          <h1 className="scroll-m-20 text-3xl tracking-tight lg:text-6xl text-slate-50 lg:mb-12 mb-4 font-bold">
            Edit User Profile
          </h1>
          <div className="rounded-full text-slate-50 bg-slate-500 lg:px-9 lg:py-6 lg:text-6xl px-7 py-4 text-4xl lg:h-28 lg:w-28 h-20 w-20 lg:mx-4 mx-2 lg:mt-4 lg:mb-8 mt-2 mt-4">
            <span>{userQueryResult.data.name[0]}</span>
          </div>
          <h3 className="scroll-m-20 text-xl tracking-tight lg:text-2xl text-slate-50 font-bold lg:mt-4 mt-2">
            {userQueryResult.data.name}
          </h3>
          <h5 className="scroll-m-20 text-l tracking-tight lg:text-xl text-slate-50">
            {userQueryResult.data.email}
          </h5>
          <div className="flex">
            <h5 className="scroll-m-20 text-l tracking-tight lg:text-xl text-slate-50 mt-4 mb-4 font-bold">
              Batch:
            </h5>
            <h5 className="scroll-m-20 text-l tracking-tight lg:text-xl text-slate-50 mt-4 mb-2 mx-2">
              {batch}
            </h5>
          </div>
          <div className="flex lg:flex-row flex-col">
            <Select onValueChange={setFirstDegree} value={firstDegree}>
              <SelectTrigger className="w-84 bg-slate-800 border-slate-700 focus:ring-slate-800 focus:ring-offset-slate-800 text-slate-50 mt-2">
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
            {firstDegree.includes("B") && secondDegree === null && (
              <Select onValueChange={setSecondDegree}>
                <SelectTrigger className="w-84 lg:mx-4 bg-slate-800 border-slate-700 focus:ring-slate-800 focus:ring-offset-slate-800 text-slate-50 mt-2">
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

            {firstDegree.includes("B") && secondDegree !== null && (
              <Select onValueChange={setSecondDegree} value={secondDegree}>
                <SelectTrigger className="w-84 lg:mx-4 bg-slate-800 border-slate-700 focus:ring-slate-800 focus:ring-offset-slate-800 text-slate-50 mt-2">
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
            className="w-fit mt-12 bg-slate-800 font-bold hover:bg-slate-700 transition ease-in-out"
            onClick={handleSubmit}
          >
            Update Profile
          </Button>
        </div>
      </div>
      <span className="fixed bottom-0 bg-slate-800 w-full text-center py-1 text-md lg:text-lg text-slate-400">
        Powered by CRUx: The Programming and Computing Club of BITS Hyderabad
      </span>
    </>
  );
}

export default editUserProfileRoute;
