import { Route } from "@tanstack/react-router";
import { Clipboard, ClipboardCheck, Globe, Lock } from "lucide-react";
import { useRef, useState } from "react";
import ReportIssue from "@/components/ReportIssue";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  handleLoginRedirect,
  handleNotFound,
} from "@/data-access/errors/handlers";
import toastHandler from "@/data-access/errors/toastHandler";
import useEditTimetable from "@/data-access/hooks/useEditTimetable";
import useTimetable, {
  timetableQueryOptions,
} from "@/data-access/hooks/useTimetable";
import authenticatedRoute from "../AuthenticatedRoute";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../components/ui/use-toast";
import { router } from "../main";

const finalizeTimetableRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "finalize/$timetableId",
  loader: ({ context: { queryClient }, params: { timetableId } }) =>
    queryClient.ensureQueryData(timetableQueryOptions(timetableId)),
  component: FinalizeTimetable,
  errorComponent: ({ error }) => {
    const { toast } = useToast();
    handleLoginRedirect(error);
    handleNotFound(error);
    toastHandler(error, toast);
  },
});

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
  const { timetableId } = finalizeTimetableRoute.useParams();
  const {
    data: timetable,
    isError: isTimetableError,
    isLoading: isTimetableLoading,
    error: timetableError,
  } = useTimetable(timetableId);

  const { mutate: editTimetable } = useEditTimetable();

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

  return (
    <div className="flex lg:pl-96 pl-12 text-foreground lg:pt-48 pt-40 w-full">
      <div className="flex flex-col w-full">
        <span className="text-5xl font-bold">{headingText}</span>
        <Label htmlFor="name" className="mt-8 mb-2 text-lg">
          Name
        </Label>
        <Input
          ref={nameInput}
          id="name"
          defaultValue={timetable.name}
          placeholder="Timetable Name"
          className="text-xl lg:w-1/3 w-4/5 bg-muted ring-primary-foreground ring-offset-slate-700 border-slate-700"
        />
        <Label htmlFor="share" className="mt-4 mb-2 text-lg">
          Share your timetable
        </Label>
        <div className="flex items-center lg:w-1/3 w-4/5" id="share">
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Button
                  className="rounded-r-none rounded-l-lg bg-muted hover:bg-muted-foreground text-foreground px-4 mr-0"
                  onClick={() => setPrivate(!privateTimetable)}
                >
                  {privateTimetable ? <Lock /> : <Globe />}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-muted text-foreground border-primary-foreground">
                {privateTimetable
                  ? "Private (only people with the link can view)"
                  : "Public (anyone can view)"}
              </TooltipContent>
            </Tooltip>
            <Input
              disabled
              value={`${import.meta.env.VITE_FRONTEND_URL}/view/${timetableId}`}
              className="text-xl ml-0 rounded-none bg-muted ring-primary-foreground ring-offset-primary-foreground border-primary-foreground"
            />
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Button
                  className="rounded-l-none bg-green-700 hover:bg-green-600 text-green-100 rounded-r-lg px-4 mr-0"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${
                        import.meta.env.VITE_FRONTEND_URL
                      }/view/${timetableId}`,
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  }}
                >
                  {copied ? <ClipboardCheck /> : <Clipboard />}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-muted text-foreground border-primary-foreground">
                {copied ? "Copied!" : "Copy link to timetable"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button
          className="bg-green-700 hover:bg-green-600 w-1/3 mt-8 text-green-100 px-4 mr-0 text-lg font-bold"
          onClick={() =>
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
                  router.navigate({
                    to: "/",
                    params: { timetableId: timetableId },
                  });
                },
              },
            )
          }
        >
          Finish
        </Button>
      </div>
    </div>
  );
}

export default finalizeTimetableRoute;
