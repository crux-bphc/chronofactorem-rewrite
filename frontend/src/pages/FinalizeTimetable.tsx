import { createLazyRoute } from "@tanstack/react-router";
import { Check, ChevronLeft, Copy, Globe, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BottomBar } from "@/components/BottomBar";
import { ButtonLabel } from "@/components/ButtonLabel";
import ReportIssue from "@/components/ReportIssue";
import { toast } from "@/components/ui/use-toast";
import useEditTimetable from "@/data-access/hooks/useEditTimetable";
import useTimetable from "@/data-access/hooks/useTimetable";
import { HapticTap, haptic } from "@/lib/haptics";
import { preloadOnIntent } from "@/lib/preloadOnIntent";
import { TIMETABLE_TITLE_VT } from "@/lib/sharedTransition";
import { cn } from "@/lib/utils";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { router } from "../router";

function FinalizeTimetable() {
  const headingOptions = [
    "Anything else?",
    "The final touch",
    "One last thing",
    "Almost there!",
  ];

  const [headingText] = useState(
    headingOptions[Math.floor(Math.random() * headingOptions.length)],
  );
  const [privateTimetable, setPrivate] = useState(false);
  const [copied, setCopied] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const { timetableId } = Route.useParams();
  const {
    data: timetable,
    isError: isTimetableError,
    isLoading: isTimetableLoading,
    error: timetableError,
  } = useTimetable(timetableId);

  const { mutate: editTimetable, isPending } = useEditTimetable();
  // isPending lags a render behind a fast double tap, so guard synchronously.
  const finishing = useRef(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  if (isTimetableLoading) {
    return <span>Loading...</span>;
  }

  if (isTimetableError || timetable === undefined) {
    return (
      <ReportIssue
        error={JSON.stringify(
          timetableError
            ? timetableError.message
            : "timetable query result is undefined",
        )}
      />
    );
  }

  const link = `${import.meta.env.VITE_FRONTEND_URL}/view/${timetableId}`;

  const copyLink = async () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(link);
      haptic("success");
      setCopied(true);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      haptic("error");
      setCopied(false);
      toast({
        title: "Could not copy link",
        description: "Your browser blocked clipboard access.",
      });
    }
  };

  const finish = () => {
    if (finishing.current) return;
    finishing.current = true;
    editTimetable(
      {
        id: timetable.id,
        body: {
          name: nameInput.current?.value || timetable.name,
          isPrivate: privateTimetable,
          isDraft: false,
        },
      },
      {
        onSuccess: () => {
          // after the server answers, so Android only: iOS ticks only on a tap
          haptic("success");
          router.navigate({
            to: "/",
          });
        },
        onError: () => {
          finishing.current = false;
        },
      },
    );
  };

  const choices = [
    {
      isPrivate: true,
      Icon: Lock,
      title: "Private",
      subtitle: "Only people with the link can view",
    },
    {
      isPrivate: false,
      Icon: Globe,
      title: "Public",
      subtitle: "Anyone can view",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 pt-2 pb-28 lg:pt-10 lg:pb-12">
      <Button
        variant="quiet"
        size="sm"
        className="-ml-2.5"
        {...preloadOnIntent({
          to: "/edit/$timetableId",
          params: { timetableId },
        })}
        onClick={() =>
          router.navigate({
            to: "/edit/$timetableId",
            params: { timetableId },
          })
        }
      >
        <ChevronLeft />
        Back to editing
      </Button>
      <h1
        className="mt-4 text-3xl font-semibold"
        style={{ viewTransitionName: TIMETABLE_TITLE_VT }}
      >
        {headingText}
      </h1>
      <Label htmlFor="name" className="mt-6 mb-2 block">
        Name
      </Label>
      <Input
        ref={nameInput}
        id="name"
        defaultValue={timetable.name}
        placeholder="Timetable Name"
      />
      <fieldset className="mt-5 flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium text-ink">
          Share your timetable
        </legend>
        {choices.map(({ isPrivate, Icon, title, subtitle }) => (
          <label
            key={title}
            className="group grid cursor-pointer grid-cols-[22px_1fr] gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-3 transition-[border-color,box-shadow] duration-(--d-2) has-[:checked]:border-brand has-[:checked]:shadow-[inset_0_0_0_1px_var(--accent)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand"
          >
            <input
              type="radio"
              name="visibility"
              className="sr-only"
              checked={privateTimetable === isPrivate}
              onChange={() => setPrivate(isPrivate)}
            />
            <span className="mt-0.5 grid size-5 place-items-center rounded-full border-[1.5px] border-ink-faint group-has-[:checked]:border-brand">
              <span className="size-2.5 scale-0 rounded-full bg-brand transition-transform duration-(--d-2) ease-(--e-spring) group-has-[:checked]:scale-100" />
            </span>
            <span>
              <span className="flex items-center gap-1.5 font-semibold">
                <Icon className="size-3.5" />
                {title}
              </span>
              <span className="mt-0.5 block text-sm text-ink-muted">
                {subtitle}
              </span>
            </span>
          </label>
        ))}
        <div className="flex h-[46px] items-center rounded-lg border border-line bg-surface pr-1.5 pl-3.5">
          <input
            readOnly
            aria-label="Link to timetable"
            value={link}
            className="min-w-0 flex-1 bg-transparent text-lg text-ink-muted outline-none"
          />
          <Button
            variant="secondary"
            size="sm"
            className={cn(
              "h-8 max-lg:after:-inset-[7px]",
              copied && "text-brand",
            )}
            aria-label="Copy link to timetable"
            onClick={copyLink}
          >
            <span className="inline-grid size-4 place-items-center">
              <Copy
                aria-hidden="true"
                className={cn(
                  "col-start-1 row-start-1 transition-[opacity,scale] duration-(--d-2)",
                  copied ? "scale-[.6] opacity-0" : "scale-100 opacity-100",
                )}
              />
              <Check
                aria-hidden="true"
                className={cn(
                  "col-start-1 row-start-1 transition-[opacity,scale] duration-(--d-2)",
                  copied ? "scale-100 opacity-100" : "scale-[.6] opacity-0",
                )}
              />
            </span>
            <span
              className={cn(
                "grid transition-[grid-template-columns] duration-(--d-2) ease-(--e-out)",
                copied ? "grid-cols-[1fr]" : "grid-cols-[0fr]",
              )}
            >
              <span
                aria-hidden="true"
                className="overflow-hidden whitespace-nowrap"
              >
                Copied!
              </span>
            </span>
            <HapticTap className="max-lg:-inset-[7px]" />
          </Button>
          <span aria-live="polite" className="sr-only">
            {copied ? "Copied!" : ""}
          </span>
        </div>
      </fieldset>
      <BottomBar>
        <Button
          onClick={finish}
          disabled={isPending}
          aria-busy={isPending}
          {...preloadOnIntent({ to: "/" })}
        >
          <ButtonLabel loading={isPending}>Finish</ButtonLabel>
        </Button>
      </BottomBar>
    </main>
  );
}

export const Route = createLazyRoute("/authenticated/finalize/$timetableId")({
  component: FinalizeTimetable,
});
