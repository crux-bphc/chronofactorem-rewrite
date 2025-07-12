import { Route } from "@tanstack/react-router";
import { getBatchFromEmail } from "lib";
import { useState } from "react";
import DegreeDropDown from "@/components/DegreeDropDown";
import ReportIssue from "@/components/ReportIssue";
import { Button } from "@/components/ui/button";
import handleLoginRedirect from "@/data-access/errors/redirectToLogin";
import toastHandler from "@/data-access/errors/toastHandler";
import useEditUser from "@/data-access/useEditUser";
import useUser, { userQueryOptions } from "@/data-access/useUser";
import authenticatedRoute from "../AuthenticatedRoute";
import { useToast } from "../components/ui/use-toast";
import { router } from "../main";

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
  const { mutate: editUser } = useEditUser();
  const { toast } = useToast();

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
        variant: "destructive",
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

    editUser(
      { degrees },
      {
        onSuccess: () => router.navigate({ to: "/" }),
      },
    );
  };

  return (
    <>
      <div className="flex flex-col lg:pt-28 pt-20 lg:mx-60 mx-12">
        <h1 className="scroll-m-20 text-3xl tracking-tight lg:text-6xl text-foreground lg:mb-12 mb-4 font-bold">
          Edit User Profile
        </h1>
        <div className="rounded-full text-foreground bg-accent lg:text-6xl text-4xl lg:h-28 lg:w-28 h-20 w-20 flex justify-center items-center">
          <span>{user.name[0]}</span>
        </div>
        <h3 className="scroll-m-20 text-xl tracking-tight lg:text-2xl text-foreground font-bold lg:mt-4 mt-2">
          {user.name}
        </h3>
        <h5 className="scroll-m-20 text-l tracking-tight lg:text-xl text-foreground">
          {user.email}
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
          <DegreeDropDown
            firstDegree={firstDegree}
            secondDegree={secondDegree}
            setFirstDegree={setFirstDegree}
            setSecondDegree={setSecondDegree}
            year={undefined}
          />
        </div>
        <Button
          className="w-fit mt-12 bg-muted font-bold hover:bg-primary-foreground transition ease-in-out text-foreground"
          onClick={handleSubmit}
        >
          Update Profile
        </Button>
      </div>
      <span className="fixed bottom-0 bg-muted w-full text-center py-1 text-md lg:text-lg text-muted-foreground">
        Powered by CRUx: The Programming and Computing Club of BITS Hyderabad
      </span>
    </>
  );
}

export default editUserProfileRoute;
