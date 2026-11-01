import { createLazyRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ButtonLabel } from "@/components/ButtonLabel";
import { CruxMark } from "@/components/CruxMark";
import DegreeDropDown from "@/components/DegreeDropDown";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import useCreateUser from "@/data-access/hooks/useCreateUser";
import { router } from "../router";

function GetDegrees() {
  const { year } = Route.useSearch();
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
    <div className="min-h-dvh flex flex-col text-ink">
      <CruxMark />
      <div className="mx-auto w-full max-w-[400px] flex-1 flex flex-col px-6 pt-16 lg:justify-center lg:pt-0">
        <div className="flex-1 lg:flex-none">
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
        <div className="pt-6 lg:pt-8">
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isPending}
            aria-busy={isPending}
          >
            <ButtonLabel loading={isPending}>Continue</ButtonLabel>
          </Button>
        </div>
      </div>
      <p className="text-sm text-ink-muted text-center px-6 pt-6 pb-[22px]">
        Powered by CRUx: The Programming and Computing Club of BITS Hyderabad
      </p>
    </div>
  );
}

export const Route = createLazyRoute("/getDegrees")({
  component: GetDegrees,
});
