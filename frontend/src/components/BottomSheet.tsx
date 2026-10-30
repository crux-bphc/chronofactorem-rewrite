import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronRight, X } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Below lg, timetable panels open as non-modal bottom sheets, so the grid
// stays visible and usable above them; Escape and the close button still
// dismiss them
export const BottomSheet = ({
  open,
  onOpenChange,
  trigger,
  icon,
  title,
  description,
  dismissOnOutsideTap = true,
  className,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  icon?: React.ReactNode;
  title: string;
  description: string;
  dismissOnOutsideTap?: boolean;
  className?: string;
  children: React.ReactNode;
}) => (
  <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
    <DialogTrigger asChild>{trigger}</DialogTrigger>
    <DialogPortal>
      <DialogPrimitive.Content
        onInteractOutside={(e) => {
          if (!dismissOnOutsideTap) e.preventDefault();
        }}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-b-0 bg-background shadow-[0_-8px_30px_rgb(0_0_0/0.12)] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=open]:duration-300",
          className,
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b py-1.5 pl-4 pr-2">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            {icon}
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {description}
          </DialogDescription>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close"
              className="rounded-full"
            >
              <X className="size-4" />
            </Button>
          </DialogClose>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  </Dialog>
);

// scrolling body for sheets that list rows, on the side menu's background
export const BottomSheetList = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div className="min-h-0 flex-1 overflow-y-auto bg-secondary pb-[env(safe-area-inset-bottom)]">
    {children}
  </div>
);

// a row styled like the side menu's CDC list
export const BottomSheetRow = ({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <Button
    variant="secondary"
    disabled={disabled}
    onClick={onClick}
    className="h-auto min-h-16 w-full whitespace-normal py-2 rounded-none text-left bg-secondary dark:hover:bg-slate-700 hover:bg-slate-200"
  >
    <div className="flex justify-between w-full items-center gap-2">
      <span className="min-w-0">{children}</span>
      <ChevronRight />
    </div>
  </Button>
);

export default BottomSheet;
