import { createLazyRoute } from "@tanstack/react-router";
import { getBatchFromEmail, unknownDegree } from "lib";
import { useRef, useState } from "react";
import { BottomBar } from "@/components/BottomBar";
import { ButtonLabel } from "@/components/ButtonLabel";
import DegreeDropDown from "@/components/DegreeDropDown";
import ReportIssue from "@/components/ReportIssue";
import { Button } from "@/components/ui/button";
import useEditUser from "@/data-access/hooks/useEditUser";
import useUser from "@/data-access/hooks/useUser";
import { narrowPageClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";
import { useToast } from "../components/ui/use-toast";
import { router } from "../router";

function EditUserProfile() {
  const { data: user, isLoading, isError, error } = useUser();
  const { mutate: editUser, isPending } = useEditUser();
  const { toast } = useToast();
  // isPending lags a render behind a fast double tap, so guard synchronously.
  const submitting = useRef(false);

  const [firstDegree, setFirstDegree] = useState<string | null>(
    user?.degrees?.[0] ?? null,
  );
  const [secondDegree, setSecondDegree] = useState<string | null>(
    user ? (user.degrees.length > 1 ? user.degrees[1] : null) : null,
  );

  if (isLoading) {
    return <span>Loading...</span>;
  }

  if (isError || user === undefined || firstDegree === null) {
    return (
      <ReportIssue
        error={JSON.stringify(
          error ? error.message : "user query result is undefined",
        )}
      />
    );
  }

  const batch = getBatchFromEmail(user.email);

  const handleSubmit = async () => {
    if (firstDegree.includes("B") && secondDegree === null) {
      toast({
        title: "Select your second degree!",
      });
      return;
    }

    const degrees = firstDegree.includes("B")
      ? secondDegree !== null
        ? secondDegree !== "A0"
          ? [firstDegree, secondDegree]
          : [firstDegree]
        : [firstDegree]
      : [firstDegree];

    if (submitting.current) return;
    submitting.current = true;
    editUser(
      { degrees },
      {
        onError: () => {
          submitting.current = false;
        },
        onSuccess: () => router.navigate({ to: "/" }),
      },
    );
  };

  const canEdit = !user.degrees.includes(unknownDegree);

  return (
    <main className={cn(narrowPageClass, "pt-4")}>
      <h1 className="text-3xl font-medium tracking-[-0.03em] lg:text-[38px]">
        Edit User Profile
      </h1>
      <div className="mt-6 flex items-center gap-3.5 rounded-xl border border-line bg-surface p-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-full border border-line bg-bg text-xl font-medium">
          {user.name[0]}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-medium">{user.name}</p>
          <p className="font-mono text-xs text-ink-muted break-words">
            {user.email}
          </p>
        </div>
      </div>
      {batch !== "0000" && (
        <div className="mt-4 flex h-12 items-center justify-between rounded-lg border border-line bg-surface px-4">
          <span className="text-sm text-ink-muted">Batch</span>
          <span className="font-mono text-sm font-medium">{batch}</span>
        </div>
      )}
      {canEdit && (
        <>
          <div className="mt-4">
            <DegreeDropDown
              firstDegree={firstDegree}
              secondDegree={secondDegree}
              setFirstDegree={setFirstDegree}
              setSecondDegree={setSecondDegree}
              year={undefined}
            />
          </div>
          <BottomBar>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              aria-busy={isPending}
            >
              <ButtonLabel loading={isPending}>Update Profile</ButtonLabel>
            </Button>
          </BottomBar>
        </>
      )}
    </main>
  );
}

export const Route = createLazyRoute("/authenticated/editProfile")({
  component: EditUserProfile,
});
