import { unknownDegree } from "lib";
import {
  Copy,
  Download,
  Edit2,
  Ellipsis,
  GripHorizontal,
  GripVertical,
  LoaderCircle,
  Menu,
  Send,
  Trash,
} from "lucide-react";
import { useState } from "react";
import CDCWarningsTooltip from "@/components/CDCWarningsTooltip";
import DeleteTimetableDialog from "@/components/DeleteTimetableDialog";
import TimetableWarningsTooltip from "@/components/TimetableWarningsTooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const { mutateAsync: copyTimetable } = useCopyTimetable();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (timetable === undefined || courses === undefined) return;

  const isAuthor = user?.id === timetable.authorId;
  const canEdit = !isOnEditPage && isAuthor;
  const canCopy = user !== undefined;
  const publishBlocker =
    timetable.sections.length === 0
      ? "Add a course before publishing"
      : timetable.warnings.length !== 0
        ? "Complete the missing sections before publishing"
        : null;

  const editThisTimetable = () =>
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
      });

  const copyThisTimetable = () => {
    dispatch({
      type: TimetableActionType.SetIsCopyingTimetable,
      isCopyingTimetable: true,
    });
    setTimeout(() => {
      // the copying spinner unmounts this header before the
      // copy finishes, and react query drops per-call mutate
      // callbacks once their component unmounts, so navigate
      // from the promise instead
      copyTimetable(timetable.id)
        .then((res) =>
          router.navigate({
            to: "/edit/$timetableId",
            params: { timetableId: res.data.id },
          }),
        )
        .catch(() => {
          // useCopyTimetable already toasts the error
        });
      setTimeout(() => {
        dispatch({
          type: TimetableActionType.SetIsCopyingTimetable,
          isCopyingTimetable: false,
        });
      }, 1000);
    }, 1000);
  };

  const publish = () =>
    router.navigate({
      to: "/finalize/$timetableId",
      params: { timetableId: timetable.id },
    });

  const badge = (
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
  );

  const deleteDialog = isAuthor && (
    <DeleteTimetableDialog
      timetableId={timetable.id}
      onDeleted={() => router.navigate({ to: "/" })}
      open={deleteOpen}
      onOpenChange={setDeleteOpen}
    />
  );

  return (
    <>
      {/* phones: title, one meta line, then the two things you came for */}
      <div className="flex flex-col gap-3 p-4 sm:hidden">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold leading-tight break-words">
              {timetable.name}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {badge}
              <span>
                <span className="font-bold">Last Updated: </span>
                {new Date(timetable.lastUpdated).toLocaleString()}
              </span>
            </div>
          </div>
          {(canEdit || canCopy || isAuthor) && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label="More actions"
                >
                  <Ellipsis className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                {canEdit && (
                  <DropdownMenuItem
                    disabled={timetable.archived || isEditing}
                    onSelect={editThisTimetable}
                    className="gap-2"
                  >
                    <Edit2 className="size-4" />
                    {timetable.archived
                      ? "Cannot edit archived timetable"
                      : "Edit Timetable"}
                  </DropdownMenuItem>
                )}
                {canCopy && (
                  <DropdownMenuItem
                    disabled={timetable.archived || isEditing}
                    onSelect={copyThisTimetable}
                    className="gap-2"
                  >
                    <Copy className="size-4" />
                    {timetable.archived
                      ? "Cannot copy archived timetable"
                      : "Copy Timetable"}
                  </DropdownMenuItem>
                )}
                {isAuthor && (
                  <>
                    {(canEdit || canCopy) && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onSelect={() => setDeleteOpen(true)}
                      className="gap-2 text-red-600 focus:bg-red-500/10 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                    >
                      <Trash className="size-4" />
                      Delete Timetable
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {isOnEditPage && (
          <div className="flex flex-wrap items-center gap-2 empty:hidden">
            <CDCWarningsTooltip />
            <TimetableWarningsTooltip />
          </div>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-10 flex-1"
            onClick={() =>
              dispatch({ type: TimetableActionType.SetSidebarOpen, open: true })
            }
          >
            <Menu className="size-4" />
            Courses and exams
          </Button>
          {isOnEditPage ? (
            <Button
              disabled={publishBlocker !== null}
              className="h-10 min-w-32 bg-green-900 text-base text-green-200 hover:bg-green-800"
              onClick={publish}
            >
              <Send className="size-4" />
              Publish
            </Button>
          ) : (
            <Button
              disabled={isExporting}
              onClick={generateScreenshot}
              className="h-10 min-w-32"
            >
              {isExporting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              PNG
            </Button>
          )}
        </div>
        {isOnEditPage && publishBlocker !== null && (
          <p className="-mt-1 text-right text-xs text-muted-foreground">
            {publishBlocker}
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-between gap-x-4 gap-y-2 p-4 max-sm:hidden">
        <span className="min-w-0">
          <p className="font-bold break-words lg:text-3xl text-md sm:text-lg md:text-xl">
            {timetable.name}
          </p>
          <span className="flex lg:flex-row flex-col lg:items-center justify-normal gap-2">
            {badge}
            <span className="lg:text-md md:text-sm text-xs text-muted-foreground">
              <p className="font-bold inline">Last Updated: </p>
              <p className="inline">
                {new Date(timetable.lastUpdated).toLocaleString()}
              </p>
            </span>
          </span>
        </span>
        <span className="flex flex-wrap justify-center items-center gap-2">
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
                    <LoaderCircle className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5 md:w-6 md:h-6" />
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
                  aria-label={`Make timetable ${isVertical ? "horizontal" : "vertical"}`}
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
          {canEdit && (
            <Tooltip>
              <TooltipTrigger
                className={timetable.archived ? "cursor-not-allowed" : ""}
              >
                <Button
                  disabled={timetable.archived || isEditing}
                  aria-label="Edit timetable"
                  variant="ghost"
                  className="rounded-full p-3"
                  onClick={editThisTimetable}
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
          {canCopy && (
            <Tooltip>
              <TooltipTrigger
                className={timetable.archived ? "cursor-not-allowed" : ""}
              >
                <Button
                  disabled={timetable.archived || isEditing}
                  aria-label="Copy timetable"
                  variant="ghost"
                  className="rounded-full p-3"
                  onClick={copyThisTimetable}
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
          )}
          {isAuthor && (
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
                    disabled={publishBlocker !== null}
                    className="text-green-200 w-fit text-xl p-4 ml-4 bg-green-900 hover:bg-green-800"
                    onClick={publish}
                  >
                    <div className="hidden md:flex">Publish</div>
                    <div className="flex md:hidden">
                      <Send className="h-6 w-6" />
                    </div>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{publishBlocker ?? "Publish Timetable"}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </span>
      </div>
      {deleteDialog}
    </>
  );
};

export default TimetableHeader;
