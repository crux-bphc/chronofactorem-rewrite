import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type React from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useDeleteTimetable from "@/data-access/hooks/useDeleteTimetable";

export const DeleteTimetableDialog = ({
  timetableId,
  onDeleted,
  children,
}: {
  timetableId: string;
  onDeleted?: () => void;
  children: React.ReactNode;
}) => {
  const { mutate: deleteTimetable } = useDeleteTimetable();

  return (
    <AlertDialog>
      <Tooltip>
        <AlertDialogTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="rounded-full p-3 hover:bg-destructive/90 hover:text-destructive-foreground"
            >
              {children}
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
            All your progress on this timetable will be lost, and unrecoverable.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogPrimitive.Action asChild>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTimetable(timetableId, { onSuccess: onDeleted })
              }
            >
              Delete
            </Button>
          </AlertDialogPrimitive.Action>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteTimetableDialog;
