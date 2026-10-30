import { Route } from "@tanstack/react-router";
import { ArrowLeft, Check, Copy, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { TimetablePageError } from "@/components/TimetablePageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import useEditTimetable from "@/data-access/hooks/useEditTimetable";
import useTimetable, {
  timetableQueryOptions,
} from "@/data-access/hooks/useTimetable";
import authenticatedRoute from "../AuthenticatedRoute";
import CenteredSpinner from "../components/CenteredSpinner";
import { router } from "../router";

const finalizeTimetableRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "finalize/$timetableId",
  loader: ({ context: { queryClient }, params: { timetableId } }) =>
    queryClient.ensureQueryData(timetableQueryOptions(timetableId)),
  component: FinalizeTimetable,
  pendingComponent: CenteredSpinner,
  errorComponent: TimetablePageError,
});

function FinalizeTimetable() {
  const { timetableId } = finalizeTimetableRoute.useParams();
  const { data: timetable } = useTimetable(timetableId);
  const [name, setName] = useState<string | null>(null);
  const [privateTimetable, setPrivate] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const { mutateAsync: editTimetable, isPending } = useEditTimetable();
  if (!timetable) return <CenteredSpinner />;
  const link = `${window.location.origin}/view/${timetableId}`;
  const isPrivate = privateTimetable ?? timetable.private;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8 sm:py-16">
      <Button
        variant="ghost"
        className="mb-6 -ml-3 gap-2"
        onClick={() =>
          router.navigate({ to: "/edit/$timetableId", params: { timetableId } })
        }
      >
        <ArrowLeft className="size-4" />
        Back to editing
      </Button>
      <h1 className="text-3xl font-semibold tracking-tight">
        Ready to share your week?
      </h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Give your timetable a name and choose how to share it.
      </p>
      <form
        className="space-y-6"
        onSubmit={async (event) => {
          event.preventDefault();
          if (isPending || !(name ?? timetable.name).trim()) return;
          try {
            await editTimetable({
              id: timetable.id,
              body: {
                name: (name ?? timetable.name).trim(),
                isPrivate,
                isDraft: false,
              },
            });
            await router.navigate({
              to: "/view/$timetableId",
              params: { timetableId },
            });
          } catch {
            /* The mutation reports the error. */
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="timetable-name">Timetable name</Label>
          <Input
            id="timetable-name"
            required
            maxLength={200}
            value={name ?? timetable.name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
          <div>
            <Label htmlFor="unlisted">Unlisted timetable</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPrivate
                ? "Only people you share the link with can find it."
                : "Your timetable can be discovered publicly."}{" "}
              Anyone with the link can view it after publishing.
            </p>
          </div>
          <Switch
            id="unlisted"
            checked={isPrivate}
            onCheckedChange={setPrivate}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="share-link">Share link</Label>
          <div className="flex gap-2">
            <Input
              id="share-link"
              value={link}
              readOnly
              className="min-w-0"
              onFocus={(event) => event.target.select()}
            />
            <Button
              type="button"
              variant="outline"
              aria-label="Copy timetable link"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                } catch {
                  toast({
                    title: "Could not copy link",
                    description: "Select the link and copy it manually.",
                    variant: "destructive",
                  });
                }
              }}
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The link becomes available to others once you publish.
          </p>
        </div>
        {!timetable.sections.length && (
          <p role="alert" className="text-sm text-destructive">
            Add a course before publishing.
          </p>
        )}
        {!!timetable.warnings.length && (
          <p role="alert" className="text-sm text-destructive">
            Complete the missing sections before publishing.
          </p>
        )}
        <Button
          type="submit"
          disabled={
            isPending ||
            !!timetable.warnings.length ||
            !timetable.sections.length
          }
          className="w-full gap-2 bg-emerald-700 text-white hover:bg-emerald-600"
        >
          {isPending && <LoaderCircle className="size-4 animate-spin" />}
          {isPending ? "Publishing..." : "Publish timetable"}
        </Button>
      </form>
    </main>
  );
}
export default finalizeTimetableRoute;
