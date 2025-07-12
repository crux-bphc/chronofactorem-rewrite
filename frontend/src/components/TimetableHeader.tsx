import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowUpRightFromCircle,
  Copy,
  Download,
  Edit2,
  GripHorizontal,
  GripVertical,
  Send,
  Trash,
} from "lucide-react";
import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TimetableActionType, useTimetableState } from "@/context";
import toastHandler from "@/data-access/errors/toastHandler";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { router } from "../main";
import { toast } from "./ui/use-toast";

const TimetableHeader = ({
  isOnEditPage,
  generateScreenshot,
}: {
  isOnEditPage: boolean;
  generateScreenshot: () => void;
}) => {
  const {
    state: {
      isVertical,
      user,
      courses,
      timetable,
      coursesInTimetable,
      cdcs,
      screenIsLarge,
    },
    dispatch,
  } = useTimetableState();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () => {
      return axios.post(`/api/timetable/${timetable?.id}/delete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.navigate({ to: "/" });
    },
    onError: (error) => toastHandler(error, toast),
  });

  const copyMutation = useMutation({
    mutationFn: () => {
      return axios.post<{ message: string; id: string }>(
        `/api/timetable/${timetable?.id}/copy`,
      );
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.navigate({
        to: "/edit/$timetableId",
        params: { timetableId: response.data.id },
      });
    },
    onError: (error) => toastHandler(error, toast),
  });
  const cdcNotFoundWarning = useMemo(
    () =>
      cdcs.filter((e) => e.id === null && e.type === "warning") as {
        id: null;
        type: "warning";
        warning: string;
      }[],
    [cdcs],
  );
  const editMutation = useMutation({
    mutationFn: (body: {
      name: string;
      isPrivate: boolean;
      isDraft: boolean;
    }) => {
      return axios.post(`/api/timetable/${timetable?.id}/edit`, body);
    },
    onSuccess: () => {
      if (timetable === undefined) return;
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.navigate({
        to: "/edit/$timetableId",
        params: { timetableId: timetable?.id },
      });
    },
    onError: (error) => toastHandler(error, toast),
  });

  const missingCDCs = useMemo(() => {
    const missing: {
      id: string;
      code: string;
      name: string;
    }[] = [];
    for (let i = 0; i < cdcs.length; i++) {
      if (cdcs[i].id === null) {
        const option = cdcs[i] as
          | {
              id: null;
              type: "warning";
              warning: string;
            }
          | {
              id: null;
              type: "optional";
              options: {
                id: string;
                code: string;
                name: string;
              }[];
            };
        if (
          option.type === "optional" &&
          !option.options.some((e) =>
            coursesInTimetable
              .map((added) => added.id)
              .includes(e.id as string),
          )
        ) {
          const splitCodes = option.options.map((e) => e.code).join(" (or) ");
          missing.push({
            id: "",
            code: splitCodes,
            name: "",
          });
        }
      } else {
        if (
          !coursesInTimetable.map((e) => e.id).includes(cdcs[i].id as string)
        ) {
          missing.push(
            cdcs[i] as {
              id: string;
              code: string;
              name: string;
            },
          );
        }
      }
    }
    return missing;
  }, [coursesInTimetable, cdcs]);

  const handleMissingCDCClick = (courseId: string) => {
    dispatch({
      type: TimetableActionType.SetMenuTab,
      tab: "CDCs",
    });
    dispatch({
      type: TimetableActionType.SetSelectedCourseID,
      courseID: courseId === "" ? null : courseId,
    });
  };

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
          (missingCDCs.length > 0 || cdcNotFoundWarning.length > 0) && (
            <Tooltip delayDuration={100}>
              <TooltipTrigger
                asChild
                className="hover:bg-accent hover:text-accent-foreground transition duration-200 ease-in-out"
              >
                <div className="p-2 rounded-full">
                  <AlertOctagon className="w-5 h-5 md:w-6 md:h-6 m-1" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-muted text-foreground border-muted-foreground/40 text-md">
                {missingCDCs.length > 0 && (
                  <div className="flex flex-col">
                    <span>
                      You haven't added all CDCs for this semester to your
                      timetable.
                    </span>
                    <span className="font-bold pt-2">CDCs missing:</span>
                    {missingCDCs.map((e) => (
                      <div className="flex items-center" key={e.id}>
                        <span className="ml-2">{e.code}</span>
                        <Button
                          onClick={() => {
                            handleMissingCDCClick(e.id);
                          }}
                          className="p-2 w-fit h-fit ml-2 mb-1 bg-transparent hover:bg-slate-300 dark:hover:bg-slate-700 text-secondary-foreground rounded-full"
                        >
                          <ArrowUpRightFromCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {cdcNotFoundWarning.length > 0 && (
                  <div className="flex flex-col">
                    <span className="font-bold">
                      Chrono could not find some of your CDCs in the list of
                      courses.
                    </span>
                    <span className="flex">
                      Please report this issue
                      <a
                        href="https://github.com/crux-bphc/chronofactorem-rewrite/issues"
                        className="text-blue-700 dark:text-blue-400 flex pl-1"
                      >
                        <span className="text-blue-700 dark:text-blue-400">
                          here
                        </span>
                        <ArrowUpRightFromCircle className="w-4 h-4 ml-1" />
                      </a>
                    </span>
                    <span className="font-bold pt-2">Error List:</span>

                    {cdcNotFoundWarning.map((e) => (
                      <span className="ml-2" key={e.id}>
                        {e.warning}
                      </span>
                    ))}
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          )
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
                  editMutation.mutate({
                    isDraft: true,
                    isPrivate: true,
                    name: timetable?.name ?? "",
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
                  type: TimetableActionType.SetLoading,
                  loading: true,
                });
                setTimeout(() => {
                  copyMutation.mutate();
                  setTimeout(() => {
                    dispatch({
                      type: TimetableActionType.SetLoading,
                      loading: false,
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
          <AlertDialog>
            <Tooltip>
              <AlertDialogTrigger asChild>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="rounded-full p-3 hover:bg-destructive/90 hover:text-destructive-foreground"
                  >
                    <Trash className="w-5 h-5 md:w-6 md:h-6" />
                  </Button>
                </TooltipTrigger>
              </AlertDialogTrigger>
              <TooltipContent>
                <p>Delete Timetable</p>
              </TooltipContent>
            </Tooltip>
            <AlertDialogContent className="p-8">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl">
                  Are you sure?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-destructive text-lg font-bold">
                  All your progress on this timetable will be lost, and
                  unrecoverable.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogPrimitive.Action asChild>
                  <Button
                    variant="destructive"
                    onClick={() => deleteMutation.mutate()}
                  >
                    Delete
                  </Button>
                </AlertDialogPrimitive.Action>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {timetable.warnings.length !== 0 && (
          <Tooltip delayDuration={100}>
            <TooltipTrigger
              asChild
              className="duration-200 mr-4 text-md p-2 h-fit dark:dark:hover:bg-orange-800/40 hover:bg-orange-300/40 rounded-lg px-4"
            >
              <div className="flex items-center">
                <span className="text-orange-600 dark:text-orange-400 pr-4">
                  {timetable.warnings
                    .slice(0, 2)
                    .map((x) => x.replace(":", " "))
                    .map((x, i) => (
                      <div key={x}>
                        <span className="font-bold">{x}</span>
                        {i >= 0 && i < timetable.warnings.length - 1 && (
                          <span>, </span>
                        )}
                      </div>
                    ))}
                  {timetable.warnings.length > 2 &&
                    ` and ${timetable.warnings.length - 2} other warning${
                      timetable.warnings.length > 3 ? "s" : ""
                    }`}
                </span>
                <AlertTriangle className="w-6 h-6 m-1 text-orange-600 dark:text-orange-400" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-muted text-foreground border-muted-foreground/40 text-md">
              {timetable.warnings.map((warning) => (
                <div className="pb-2" key={warning}>
                  <span className="font-bold">{warning.split(":")[0]} is</span>
                  <div className="flex flex-col pl-4">
                    {warning
                      .split(":")[1]
                      .split("")
                      .map((x) => (
                        <div className="flex items-center" key={x}>
                          <span>missing a {x} section</span>
                          <Button
                            onClick={() => {
                              dispatch({
                                type: TimetableActionType.SetSelectedCourseID,
                                courseID: courses.filter(
                                  (x) => x.code === warning.split(":")[0],
                                )[0].id,
                              });
                              dispatch({
                                type: TimetableActionType.SetSelectedSectionType,
                                courseType: x as "L" | "P" | "T",
                              });
                            }}
                            className="p-2 w-fit h-fit ml-2 mb-1 bg-transparent hover:bg-slate-300 dark:hover:bg-muted-foreground/30 text-secondary-foreground rounded-full"
                          >
                            <ArrowUpRightFromCircle className="w-4 h-4 text-foreground" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </TooltipContent>
          </Tooltip>
        )}

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
