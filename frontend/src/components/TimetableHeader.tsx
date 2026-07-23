import {
  Copy,
  Download,
  Edit2,
  GripHorizontal,
  GripVertical,
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
}: {
  isOnEditPage: boolean;
  generateScreenshot?: () => void;
}) => {
  const {
    state: { isVertical, user, courses, timetable, screenIsLarge },
    dispatch,
  } = useTimetableState();
  const { mutate: editTimetable } = useEditTimetable();
  const { mutate: copyTimetable } = useCopyTimetable();

  if (timetable === undefined || user === undefined || courses === undefined)
    return;

  return (
    <div className="flex justify-between p-4">
      <span>
        <p className="font-bold lg:text-3xl text-md sm:text-lg md:text-xl">
          {timetable.name}
        </p>
        <span className="flex lg:flex-row flex-col lg:items-center justify-normal gap-2">
          <Badge variant="default" className="w-fit">
            <p className="flex items-center gap-1">
              <span>{timetable.acadYear}</span>
              <span>|</span>
              <span>{timetable.degrees.join("")}</span>
              <span>|</span>
              <span className="flex-none">{`${timetable.year}-${timetable.semester}`}</span>
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
      <span className="flex justify-center items-center gap-2">
        {isOnEditPage ? (
          <CDCWarningsTooltip />
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={generateScreenshot}
                className="flex justify-between items-center gap-2 md:text-md text-sm"
              >
                <Download className="w-5 h-5 md:w-6 md:h-6" />
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
        {!isOnEditPage && user.id === timetable.authorId && (
          <Tooltip>
            <TooltipTrigger
              className={timetable.archived ? "cursor-not-allowed" : ""}
            >
              <Button
                disabled={timetable.archived}
                variant="ghost"
                className="rounded-full p-3"
                onClick={() =>
                  editTimetable(
                    {
                      id: timetable.id,
                      body: {
                        isDraft: true,
                        isPrivate: true,
                        name: timetable?.name ?? "",
                      },
                    },
                    {
                      onSuccess: () =>
                        router.navigate({
                          to: "/edit/$timetableId",
                          params: { timetableId: timetable.id },
                        }),
                    },
                  )
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
        <Tooltip>
          <TooltipTrigger
            className={timetable.archived ? "cursor-not-allowed" : ""}
          >
            <Button
              disabled={timetable.archived}
              variant="ghost"
              className="rounded-full p-3"
              onClick={() => {
                dispatch({
                  type: TimetableActionType.SetIsCopyingTimetable,
                  isCopyingTimetable: true,
                });
                setTimeout(() => {
                  copyTimetable(timetable.id, {
                    onSuccess: (res) =>
                      router.navigate({
                        to: "/edit/$timetableId",
                        params: { timetableId: res.data.id },
                      }),
                  });
                  setTimeout(() => {
                    dispatch({
                      type: TimetableActionType.SetIsCopyingTimetable,
                      isCopyingTimetable: false,
                    });
                  }, 1000);
                }, 1000);
              }}
            >
              <Copy className="w-5 h-5 md:w-6 md:h-6" />
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
        {user.id === timetable.authorId && (
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
                  disabled={timetable.warnings.length !== 0}
                  className="text-green-200 w-fit text-xl p-4 ml-4 bg-green-900 hover:bg-green-800"
                  onClick={() =>
                    router.navigate({
                      to: "/finalize/$timetableId",
                      params: { timetableId: timetable.id },
                    })
                  }
                >
                  <div className="hidden md:flex">Publish</div>
                  <div className="flex md:hidden">
                    <Send className="h-6 w-6" />
                  </div>
                </Button>
              </span>
            </TooltipTrigger>
          </Tooltip>
        )}
      </span>
    </div>
  );
};

export default TimetableHeader;
