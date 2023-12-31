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

      throw error;
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

  const [firstDegree, setFirstDegree] = useState<string | null>(
    userQueryResult.data?.degrees?.[0] ?? null,
  );
  const [secondDegree, setSecondDegree] = useState<string | null>(
    userQueryResult.data
      ? userQueryResult.data.degrees.length > 1
        ? userQueryResult.data.degrees[1]
        : null
      : null,
  );

  const { toast } = useToast();

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
        }
        if (error.response.status === 400) {
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
        } else if (error.response.status === 404) {
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

  if (userQueryResult.isFetching) {
    return <span>Loading...</span>;
  }

  if (
    userQueryResult.isError ||
    userQueryResult.data === undefined ||
    firstDegree === null
  ) {
    return (
      <span>
        Unexpected error:{" "}
        {JSON.stringify(
          userQueryResult.error
            ? userQueryResult.error.message
            : "user query result is undefined",
        )}{" "}
        Please report this{" "}
        <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
          here
        </a>
      </span>
    );
  }

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
    <>
      <div className="flex bg-background h-screen w-full justify-start">
        <div className="flex flex-col lg:pt-28 pt-20 lg:mx-60 mx-12">
          <h1 className="scroll-m-20 text-3xl tracking-tight lg:text-6xl text-foreground lg:mb-12 mb-4 font-bold">
            Edit User Profile
          </h1>
          <div className="rounded-full text-foreground bg-accent lg:text-6xl text-4xl lg:h-28 lg:w-28 h-20 w-20 flex justify-center items-center">
            <span>{userQueryResult.data.name[0]}</span>
          </div>
          <h3 className="scroll-m-20 text-xl tracking-tight lg:text-2xl text-foreground font-bold lg:mt-4 mt-2">
            {userQueryResult.data.name}
          </h3>
          <h5 className="scroll-m-20 text-l tracking-tight lg:text-xl text-foreground">
            {userQueryResult.data.email}
          </h5>
          <div className="flex">
            <h5 className="scroll-m-20 text-l tracking-tight lg:text-xl text-foregroun mt-4 mb-4 font-bold">
              Batch:
            </h5>
            <h5 className="scroll-m-20 text-l tracking-tight lg:text-xl text-foreground mt-4 mb-2 mx-2">
              {batch}
            </h5>
          </div>
          <div className="flex sm:flex-row flex-col">
            <Select onValueChange={setFirstDegree} value={firstDegree}>
              <SelectTrigger className="w-84 bg-muted border-primary-foreground focus:ring-muted focus:ring-offset-muted text-foreground mt-2">
                <SelectValue placeholder="Select a degree" />
              </SelectTrigger>
              <SelectContent className="bg-primary-foreground border-muted text-foreground">
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
            {firstDegree.includes("B") && (
              <Select
                onValueChange={setSecondDegree}
                value={secondDegree ?? undefined}
              >
                <SelectTrigger className="w-84 sm:mx-4 bg-muted border-primary-foreground focus:ring-muted focus:ring-offset-muted text-foreground mt-2">
                  <SelectValue placeholder="Select a degree" />
                </SelectTrigger>
                <SelectContent className="bg-primary-foreground border-muted text-foreground">
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
            className="w-fit mt-12 bg-muted font-bold hover:bg-primary-foreground transition ease-in-out text-foreground"
            onClick={handleSubmit}
          >
            Update Profile
          </Button>
        </div>
      </div>
      <span className="fixed bottom-0 bg-muted w-full text-center py-1 text-md lg:text-lg text-muted-foreground">
        Powered by CRUx: The Programming and Computing Club of BITS Hyderabad
      </span>
    </>
  );
}

export default editUserProfileRoute;
