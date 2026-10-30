import { Route } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { collegeYearType } from "lib";
import { useRef, useState } from "react";
import { z } from "zod";
import { ButtonLabel } from "@/components/ButtonLabel";
import DegreeDropDown from "@/components/DegreeDropDown";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import toastHandler from "@/data-access/errors/toastHandler";
import useCreateUser from "@/data-access/hooks/useCreateUser";
import { userQueryOptions } from "@/data-access/hooks/useUser";
import { rootRoute, router } from "../router";

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
  const { mutate: createUser, isPending } = useCreateUser();
  // isPending lags a render behind a fast double tap, so guard synchronously.
  const submitting = useRef(false);

  const handleSubmit = async () => {
    if (firstDegree) {
      if (firstDegree?.includes("B") && year >= 2 && secondDegree === null) {
        toast({
          title: "Select your second degree!",
        });
        return;
      }
      const degrees =
        firstDegree?.includes("B") && year >= 2 && secondDegree !== "A0"
          ? [firstDegree, secondDegree]
          : [firstDegree];
      if (submitting.current) return;
      submitting.current = true;
      createUser(
        { degrees },
        {
          onError: () => {
            submitting.current = false;
          },
          onSuccess: () => {
            router.navigate({ to: "/" });
          },
        },
      );
    } else {
      toast({
        title: "Select your degree!",
      });
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-bg text-ink">
      <div className="mx-auto w-full max-w-[400px] px-6 pt-16 flex-1">
        <h1 className="text-3xl font-semibold">Register</h1>
        <div className="mt-8">
          <DegreeDropDown
            firstDegree={firstDegree}
            secondDegree={secondDegree}
            setFirstDegree={setFirstDegree}
            setSecondDegree={setSecondDegree}
            year={year}
            showLabels
          />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[400px] px-6 pt-6">
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isPending}
          aria-busy={isPending}
        >
          <ButtonLabel loading={isPending}>Continue</ButtonLabel>
        </Button>
      </div>
      <p className="text-sm text-ink-muted text-center px-6 pt-6 pb-[22px]">
        Powered by CRUx: The Programming and Computing Club of BITS Hyderabad
      </p>
    </div>
  );
}

export default getDegreesRoute;
