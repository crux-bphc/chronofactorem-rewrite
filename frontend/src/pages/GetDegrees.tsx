import { Route } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { collegeYearType } from "lib";
import { useState } from "react";
import { z } from "zod";
import DegreeDropDown from "@/components/DegreeDropDown";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import toastHandler from "@/data-access/errors/toastHandler";
import useCreateUser from "@/data-access/useCreateUser";
import { userQueryOptions } from "@/data-access/useUser";
import { rootRoute, router } from "../main";

/*
Although users are always redirected to /getDegrees after login, we don't want to show them the page if they've already filled it out.
Since the user is actually created in the DB only after they properly fill out their degrees, we check if they exist in the DB by querying /api/user. 
If this succeeds, they have already filled this out and so we redirect them away to /.
If they have not filled out their degrees, they will not exist in the DB and so /api/user will return a 401 response. 
Then, we do nothing (no error toasts) and just let them fill out their degrees.
*/
const getDegreesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "getDegrees",
  validateSearch: z.object({ year: collegeYearType }),
  loader: ({ context: { queryClient } }) =>
    queryClient
      .ensureQueryData(userQueryOptions)
      .then(() => {
        router.navigate({ to: "/" });
      })
      .catch((error) => {
        if (
          error instanceof AxiosError &&
          error.response &&
          error.response.status === 401
        ) {
          // The one exception to doing nothing is if they don't have a valid session cookie (from Google OAuth)
          if (error.response.data.error === "user session expired") {
            router.navigate({ to: "/login" });
          }
        }
      }),
  component: GetDegrees,
  errorComponent: ({ error }) => {
    const { toast } = useToast();
    toastHandler(error, toast);
  },
});

function GetDegrees() {
  const { year } = getDegreesRoute.useSearch();
  const [firstDegree, setFirstDegree] = useState<string | null>(null);
  const [secondDegree, setSecondDegree] = useState<string | null>(null);
  const { toast } = useToast();
  const { mutate: createUser } = useCreateUser();

  const handleSubmit = async () => {
    if (firstDegree) {
      if (firstDegree?.includes("B") && year >= 2 && secondDegree === null) {
        toast({
          title: "Select your second degree!",
          variant: "destructive",
        });
        return;
      }
      const degrees =
        firstDegree?.includes("B") && year >= 2 && secondDegree !== "A0"
          ? [firstDegree, secondDegree]
          : [firstDegree];
      createUser(
        { degrees },
        {
          onSuccess: () => {
            router.navigate({ to: "/" });
          },
        },
      );
    } else {
      toast({
        title: "Select your degree!",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex bg-background h-screen w-full justify-center">
        <div className="flex flex-col items-center pt-48">
          <h1 className="scroll-m-20 text-xl tracking-tight lg:text-2xl text-foreground text-center mx-4">
            {`Select your degree${
              firstDegree?.includes("B") && year >= 2 ? "s" : ""
            } so we can help build your timetable:`}
          </h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <DegreeDropDown
              firstDegree={firstDegree}
              secondDegree={secondDegree}
              setFirstDegree={setFirstDegree}
              setSecondDegree={setSecondDegree}
              year={year}
            />
          </div>
          {/* <div className="scroll-m-20 text-lg tracking-tight text-foreground text-center w-2/3 pt-4">
            <b>Note:</b> If your branch is Mathematics & Computing, please
            select A7 (Computer Science) as a temporary fix since both of these
            branches will have the same courses for this semester.
          </div> */}
          <Button
            className="w-fit mt-6 bg-muted font-bold hover:bg-primary-foreground transition ease-in-out text-foreground"
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </div>
      </div>
      <span className="fixed bottom-0 bg-muted w-full text-center py-1 text-xs md:px-0 px-8 tracking-tight md:text-lg text-muted-foreground">
        Powered by CRUx: The Programming and Computing Club of BITS Hyderabad
      </span>
    </>
  );
}

export default getDegreesRoute;
