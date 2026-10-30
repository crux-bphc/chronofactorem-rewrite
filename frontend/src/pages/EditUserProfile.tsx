import { Route } from "@tanstack/react-router";
import { getBatchFromEmail, unknownDegree } from "lib";
import { useRef, useState } from "react";
import { BottomBar } from "@/components/BottomBar";
import { ButtonLabel } from "@/components/ButtonLabel";
import DegreeDropDown from "@/components/DegreeDropDown";
import ReportIssue from "@/components/ReportIssue";
import { Button } from "@/components/ui/button";
import { handleLoginRedirect } from "@/data-access/errors/handlers";
import toastHandler from "@/data-access/errors/toastHandler";
import useEditUser from "@/data-access/hooks/useEditUser";
import useUser, { userQueryOptions } from "@/data-access/hooks/useUser";
import authenticatedRoute from "../AuthenticatedRoute";
import { useToast } from "../components/ui/use-toast";
import { router } from "../router";

const editUserProfileRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "editProfile",
  loader: async ({ context: { queryClient } }) => {
    try {
      return await queryClient.ensureQueryData(userQueryOptions);
    } catch (error: unknown) {
      handleLoginRedirect(error);
      throw error;
    }
  },
  component: EditUserProfile,
  errorComponent: ({ error }) => {
    const { toast } = useToast();
    toastHandler(error, toast);
  },
});

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
    <main className="mx-auto w-full max-w-[640px] px-4 pt-2 pb-28 lg:pt-10 lg:pb-12">
      <h1 className="text-2xl lg:text-3xl font-semibold">Edit User Profile</h1>
      <div className="mt-5 flex items-center gap-3.5">
        <div className="size-14 shrink-0 rounded-full bg-sunk grid place-items-center text-xl font-semibold">
          {user.name[0]}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold">{user.name}</p>
          <p className="text-sm text-ink-muted break-words">{user.email}</p>
        </div>
      </div>
      {batch !== "0000" && (
        <div className="mt-5 flex h-[46px] items-center justify-between rounded-lg border border-line bg-surface px-3.5">
          <span className="text-ink-muted">Batch</span>
          <span className="font-medium">{batch}</span>
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

export default editUserProfileRoute;
