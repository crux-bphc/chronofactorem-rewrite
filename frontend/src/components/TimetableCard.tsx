import { Link } from "@tanstack/react-router";
import { type timetableType, unknownDegree } from "lib";
import { Edit2, Ellipsis, Trash } from "lucide-react";
import { type CSSProperties, useRef, useState } from "react";
import type { z } from "zod";
import DeleteTimetableDialog from "@/components/DeleteTimetableDialog";
import TimetableStatusChip from "@/components/TimetableStatusChip";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useEditTimetable from "@/data-access/hooks/useEditTimetable";
import { preloadOnIntent } from "@/lib/preloadOnIntent";
import { TIMETABLE_GRID_VT, TIMETABLE_TITLE_VT } from "@/lib/sharedTransition";
import { cn } from "@/lib/utils";
import { router } from "../router";
import { TimetablePreview } from "./TimetablePreview";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";

type Timetable = z.infer<typeof timetableType>;

type Props = {
  timetable: Timetable;
  shared: boolean;
  onOpen: (id: string) => void;
  onDeleted: (id: string) => void;
  className?: string;
  style?: CSSProperties;
};

export function formatCardMeta(t: Timetable, now: Date = new Date()): string {
  const parts: string[] = [];
  if (t.year !== 0) parts.push(`${t.year}-${t.semester}`);
  if (!t.degrees.includes(unknownDegree)) parts.push(t.degrees.join(""));
  const updated = new Date(t.lastUpdated);
  parts.push(
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      ...(updated.getFullYear() !== now.getFullYear()
        ? { year: "numeric" as const }
        : {}),
      hour: "numeric",
      minute: "2-digit",
    }).format(updated),
  );
  return parts.join(" · ");
}

function TimetableCard({
  timetable,
  shared,
  onOpen,
  onDeleted,
  className,
  style,
}: Props) {
  const [timetableName, setTimetableName] = useState<null | string>(null);
  const [timetableVisibility, setTimetableVisibility] = useState<
    null | boolean
  >(null);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  // The dialogs open from a menu item, so Radix has no trigger to hand focus
  // back to once they close. Return it to the ⋯ button after its own cleanup.
  const restoreFocus = () => setTimeout(() => menuButton.current?.focus(), 50);

  const {
    mutate: editTimetable,
    mutateAsync: editTimetableAsync,
    isPending,
  } = useEditTimetable();

  return (
    <article
      className={cn(
        "relative grid grid-cols-[92px_1fr_auto] items-center gap-3.5 rounded-xl border border-line bg-surface p-3.5",
        "transition-[border-color,box-shadow] duration-(--d-1) lg:hover:border-ink-faint lg:hover:shadow-float",
        "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-brand has-[a:focus-visible]:outline-offset-2",
        className,
      )}
      style={style}
    >
      <TimetablePreview
        timings={timetable.timings}
        style={shared ? { viewTransitionName: TIMETABLE_GRID_VT } : undefined}
      />
      <div className="min-w-0">
        <Link
          to={timetable.draft ? "/edit/$timetableId" : "/view/$timetableId"}
          params={{ timetableId: timetable.id }}
          onClick={() => onOpen(timetable.id)}
          data-card-link
          style={
            shared ? { viewTransitionName: TIMETABLE_TITLE_VT } : undefined
          }
          className="text-lg font-semibold text-ink line-clamp-2 break-words outline-none after:absolute after:inset-0 after:content-['']"
        >
          {timetable.name}
        </Link>
        <div className="text-sm text-ink-muted mt-[3px]">
          {formatCardMeta(timetable)}
        </div>
        <div className="mt-[7px]">
          <TimetableStatusChip timetable={timetable} />
        </div>
      </div>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="quiet"
            size="icon"
            ref={menuButton}
            aria-label={`More actions for ${timetable.name}`}
            className="relative z-10"
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!timetable.archived && !timetable.draft && (
            <DropdownMenuItem
              disabled={isPending}
              onSelect={() =>
                editTimetable({
                  id: timetable.id,
                  body: {
                    name: timetable.name,
                    isPrivate: !timetable.private,
                    isDraft: timetable.draft,
                  },
                })
              }
            >
              Make {timetable.private ? "Public" : "Private"}
            </DropdownMenuItem>
          )}
          {timetable.archived ? (
            <DropdownMenuItem
              disabled={isPending}
              onSelect={() => setArchivedOpen(true)}
            >
              <Edit2 />
              Edit Timetable
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={isPending}
              {...preloadOnIntent({
                to: "/edit/$timetableId",
                params: { timetableId: timetable.id },
              })}
              onSelect={() => {
                onOpen(timetable.id);
                editTimetableAsync({
                  id: timetable.id,
                  body: {
                    name: timetable.name,
                    isPrivate: true,
                    isDraft: true,
                  },
                })
                  .then(() => {
                    router.navigate({
                      to: "/edit/$timetableId",
                      params: { timetableId: timetable.id },
                    });
                  })
                  .catch(() => {
                    // useEditTimetable already toasts the error.
                  });
              }}
            >
              <Edit2 />
              Edit Timetable
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem tone="danger" onSelect={() => setDeleteOpen(true)}>
            <Trash />
            Delete Timetable
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteTimetableDialog
        timetableId={timetable.id}
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) restoreFocus();
        }}
        onDeleted={() => onDeleted(timetable.id)}
      />

      {timetable.archived && (
        <Dialog
          open={archivedOpen}
          onOpenChange={(open) => {
            setArchivedOpen(open);
            if (!open) restoreFocus();
          }}
        >
          <DialogContent className="sm:max-w-100">
            <DialogHeader>
              <DialogTitle>Edit Archived Timetable</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={`name-${timetable.id}`} className="text-right">
                  Name
                </Label>
                <Input
                  id={`name-${timetable.id}`}
                  value={timetableName ?? timetable.name}
                  onChange={(e) => setTimetableName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="mx-auto">
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`visibility-${timetable.id}`}
                    checked={timetableVisibility ?? timetable.private}
                    onCheckedChange={setTimetableVisibility}
                  />
                  <Label htmlFor={`visibility-${timetable.id}`}>Private</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="submit"
                  disabled={isPending}
                  onClick={() => {
                    editTimetable({
                      id: timetable.id,
                      body: {
                        name: timetableName ?? timetable.name,
                        isPrivate: timetableVisibility ?? timetable.private,
                        isDraft: false,
                      },
                    });
                  }}
                >
                  Save changes
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </article>
  );
}

export default TimetableCard;
