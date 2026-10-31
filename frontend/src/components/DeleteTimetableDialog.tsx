import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { useEffect, useId, useRef } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";
import useDeleteTimetable from "@/data-access/hooks/useDeleteTimetable";
import { HapticTap, haptic } from "@/lib/haptics";
import { useIsDesktop } from "@/lib/useIsDesktop";

const description =
  "All your progress on this timetable will be lost, and unrecoverable.";

/**
 * Delete confirmation: a bottom sheet on phones, a centred dialog on desktop.
 * Controlled only; every way of closing it reports `onOpenChange(false)`.
 */
export const DeleteTimetableDialog = ({
  timetableId,
  onDeleted,
  open,
  onOpenChange,
}: {
  timetableId: string;
  onDeleted?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const isDesktop = useIsDesktop();
  const { mutate: deleteTimetable } = useDeleteTimetable();
  const descriptionId = useId();
  const cancel = useRef<HTMLButtonElement>(null);

  // Delete stays clickable while the dialog animates out; send it once
  const sent = useRef(false);
  useEffect(() => {
    if (open) sent.current = false;
  }, [open]);
  const confirm = () => {
    if (sent.current) return;
    sent.current = true;
    deleteTimetable(timetableId, { onSuccess: onDeleted });
  };

  if (isDesktop) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="block w-[440px] max-w-[calc(100%-24px)]">
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-[14.5px] leading-normal">
            {description}
          </AlertDialogDescription>
          <div className="mt-[22px] flex justify-end gap-2.5">
            <AlertDialogPrimitive.Cancel asChild>
              <Button variant="secondary" size="sm">
                Cancel
              </Button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <Button
                variant="danger"
                size="sm"
                className="font-semibold"
                onClick={confirm}
              >
                Delete
              </Button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        aria-describedby={descriptionId}
        // vaul skips Radix's autofocus; start on the safe choice so focus
        // is trapped in the sheet and Enter never deletes by accident
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          cancel.current?.focus();
        }}
      >
        <SheetHeader title="Are you sure?" />
        <p
          id={descriptionId}
          className="px-4 text-[14.5px] leading-normal text-ink-muted"
        >
          {description}
        </p>
        <div className="grid grid-cols-2 gap-2.5 px-4 pt-5">
          <SheetClose asChild>
            <Button ref={cancel} variant="secondary">
              Cancel
            </Button>
          </SheetClose>
          <Button
            variant="danger"
            className="relative"
            onClick={() => {
              haptic("warning");
              confirm();
              onOpenChange(false);
            }}
          >
            Delete
            <HapticTap />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DeleteTimetableDialog;
