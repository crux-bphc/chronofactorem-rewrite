import { ToastAction } from "@radix-ui/react-toast";
import { queryOptions } from "@tanstack/react-query";
import { ErrorComponent, Route } from "@tanstack/react-router";
import axios, { AxiosError } from "axios";
import { ArrowUpRightFromCircle } from "lucide-react";
import { z } from "zod";
import { userWithTimetablesType } from "../../lib/src/index";
import authenticatedRoute from "./AuthenticatedRoute";
import { useToast } from "./components/ui/use-toast";
import { router } from "./main";

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

const aboutRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "about",
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
  component: About,
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

function About() {
  return (
    <main className="pl-20 pt-16">
      <h1 className="text-4xl font-bold tracking-tight">
        About ChronoFactorem <sup>ᵝ</sup>
      </h1>
      <div className="w-2/3 text-2xl">
        <p className="pt-4">
          ChronoFactorem is a project that makes the process of creating
          timetables and sharing them easy as pie. ChronoFactorem is developed
          and maintained by CRUx: The Programming and Computing Club of BITS
          Hyderabad.
        </p>
        <p className="pt-4">
          This version of ChronoFactorem is a beta version we fastracked so that
          we can get the new version of ChronoFactorem out for this registration
          session. The frontend code is not up to CRUx standards, and was
          written by one sleepless loser in the span of 5 days, which is why you
          might experience some bugs. If you do find them, please report them{" "}
          <a
            href="https://github.com/crux-bphc/chronofactorem-rewrite/issues"
            className="text-blue-400 inline pl-1 items-center"
          >
            here
            <ArrowUpRightFromCircle className="inline w-5 h-5 ml-1 mr-1" />
          </a>
        </p>
        <p className="pt-4">
          This is a ground-up rewrite of the last iteration of ChronoFactorem.
          We thank Harshvardhan Jha (Product Owner + Developer), Aviral Agarwal
          (Scrum Master + Developer), Kushagra Gupta (Developer), Abhinav
          Sukumar Rao (Developer), Vikramjeet Das (Developer) for the previous
          version.
        </p>
        <p className="pt-4">
          This version has a different set of features to make it easier to make
          timetables. As we move on from this registration, you will see even
          more features being added to this project.
        </p>
        <p className="pt-4">
          The backend code is some of the most solid code we've written over the
          years, you can go look at it and star it{" "}
          <a
            href="https://github.com/crux-bphc/chronofactorem-rewrite/"
            className="text-blue-400 inline pl-1 items-center"
          >
            here
            <ArrowUpRightFromCircle className="inline w-5 h-5 ml-1 mr-1" />
          </a>
          . We thank Arunachala AM, Anurav Garg, Kovid Lakhera, Shreyash Dash,
          Palaniappan R, Jason Goveas, Karthik Prakash, Meghraj Goswami, and
          Soumitra Shewale for this rewrite of ChronoFactorem.
        </p>
      </div>
    </main>
  );
}

export default aboutRoute;
