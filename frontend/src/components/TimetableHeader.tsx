import { unknownDegree } from "lib";
import {
  Copy,
  Download,
  Edit2,
  GripHorizontal,
  GripVertical,
  LoaderCircle,
  Send,
  Trash,
} from "lucide-react";
import CDCWarningsTooltip from "@/components/CDCWarningsTooltip";
import DeleteTimetableDialog from "@/components/DeleteTimetableDialog";
import TimetableWarningsTooltip from "@/components/TimetableWarningsTooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TimetableActionType, useTimetableState } from "@/context";
import useCopyTimetable from "@/data-access/hooks/useCopyTimetable";
import useEditTimetable from "@/data-access/hooks/useEditTimetable";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { router } from "../router";

const TimetableHeader = ({
  isOnEditPage,
  generateScreenshot,
  isExporting = false,
}: {
  isOnEditPage: boolean;
  generateScreenshot?: () => void;
  isExporting?: boolean;
}) => {
  const {
    state: { isVertical, user, courses, timetable, screenIsLarge },
    dispatch,
  } = useTimetableState();
  const { mutateAsync: editTimetable, isPending: isEditing } =
    useEditTimetable();
  const { mutateAsync: copyTimetable, isPending: isCopying } =
    useCopyTimetable();

  if (timetable === undefined || courses === undefined) return;

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 py-5">
      <span className="min-w-0 flex-1 basis-48">
        <p className="break-words text-xl font-semibold tracking-tight sm:text-2xl">
          {timetable.name}
        </p>
        <span className="flex lg:flex-row flex-col lg:items-center justify-normal gap-2">
          <Badge variant="default" className="w-fit">
            <p className="flex items-center gap-1">
              <span>{timetable.acadYear}</span>
              {!timetable.degrees.includes(unknownDegree) && (
                <>
                  <span>|</span>
                  <span>{timetable.degrees.join("")}</span>
                </>
              )}
              {timetable.year !== 0 && (
                <>
                  <span>|</span>
                  <span className="flex-none">{`${timetable.year}-${timetable.semester}`}</span>
                </>
              )}
            </p>
          </Badge>
          <span className="lg:text-md md:text-sm text-xs text-muted-foreground">
            <p className="font-bold inline">Last Updated: </p>
            <p className="inline">
              {new Date(timetable.lastUpdated).toLocaleString()}
            </p>
          </span>
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-1.5">
        {isOnEditPage ? (
          <CDCWarningsTooltip />
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                disabled={isExporting}
                onClick={generateScreenshot}
                className="flex justify-between items-center gap-2 md:text-md text-sm"
              >
                {isExporting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                PNG
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download timetable as image</p>
            </TooltipContent>
          </Tooltip>
        )}
        {screenIsLarge && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label={`Use ${isVertical ? "horizontal" : "vertical"} layout`}
                variant="ghost"
                className="rounded-full p-3"
                onClick={() =>
                  dispatch({
                    type: TimetableActionType.ToggleVertical,
                  })
                }
              >
                {isVertical ? <GripVertical /> : <GripHorizontal />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Make timetable {isVertical ? "horizontal" : "vertical"}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {!isOnEditPage && user?.id === timetable.authorId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                disabled={timetable.archived || isEditing || isCopying}
                aria-label="Edit timetable"
                variant="ghost"
                className="rounded-full p-3"
                onClick={() =>
                  editTimetable({
                    id: timetable.id,
                    body: {
                      isDraft: true,
                      isPrivate: true,
                      name: timetable?.name ?? "",
                    },
                  })
                    .then(() =>
                      router.navigate({
                        to: "/edit/$timetableId",
                        params: { timetableId: timetable.id },
                      }),
                    )
                    .catch(() => {
                      // useEditTimetable already toasts the error.
                    })
                }
              >
                <Edit2 className="w-5 h-5 md:w-6 md:h-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {timetable.archived
                  ? "Cannot edit archived timetable"
                  : "Edit Timetable"}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
        {user !== undefined && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                disabled={timetable.archived || isEditing || isCopying}
                variant="ghost"
                className="rounded-full p-3"
                aria-label="Copy timetable"
                onClick={() => {
                  copyTimetable(timetable.id)
                    .then((res) =>
                      router.navigate({
                        to: "/edit/$timetableId",
                        params: { timetableId: res.data.id },
                      }),
                    )
                    .catch(() => {
                      /* The mutation reports the error. */
                    });
                }}
              >
                {isCopying ? (
                  <LoaderCircle className="size-5 animate-spin" />
                ) : (
                  <Copy className="size-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {timetable.archived
                  ? "Cannot copy archived timetable"
                  : "Copy Timetable"}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
        {user?.id === timetable.authorId && (
          <DeleteTimetableDialog
            timetableId={timetable.id}
            onDeleted={() => router.navigate({ to: "/" })}
          >
            <Trash className="w-5 h-5 md:w-6 md:h-6" />
          </DeleteTimetableDialog>
        )}

        <TimetableWarningsTooltip />

        {isOnEditPage && (
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <span>
                <Button
                  disabled={
                    timetable.warnings.length !== 0 ||
                    timetable.sections.length === 0
                  }
                  className="bg-emerald-700 text-white hover:bg-emerald-600"
                  onClick={() =>
                    router.navigate({
                      to: "/finalize/$timetableId",
                      params: { timetableId: timetable.id },
                    })
                  }
                >
                  <Send className="size-4" /> Publish
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {timetable.sections.length === 0
                ? "Add a course before publishing"
                : timetable.warnings.length
                  ? "Complete the missing sections before publishing"
                  : "Publish your timetable"}
            </TooltipContent>
          </Tooltip>
        )}
      </span>
    </div>
  );
};

export default TimetableHeader;
