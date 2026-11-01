import {
  AlertTriangle,
  Check,
  Columns3,
  Copy,
  Download,
  Edit2,
  Ellipsis,
  LoaderCircle,
  Rows3,
  Send,
  Trash,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import DeleteTimetableDialog from "@/components/DeleteTimetableDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Roll } from "@/components/ui/roll";
import { Segmented } from "@/components/ui/segmented";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WarningsList } from "@/components/WarningsList";
import { useTimetableState } from "@/context";
import { useFadingValue } from "@/lib/sectionPreview";
import { useOrientation } from "@/lib/useOrientation";
import { useTimetableActions } from "@/lib/useTimetableActions";
import type { ExportStatus } from "@/lib/useTimetableExport";
import { useTimetableNav } from "@/lib/useTimetableNav";
import { useWarningsSummary } from "@/lib/useWarningsSummary";
import { cn } from "@/lib/utils";
import { router } from "../../router";

type Layout = "phone" | "desktop";

/** Phone: the ⚠ count beside the meta line. Opens the warnings sheet. */
export function WarningsChip() {
  const { count } = useWarningsSummary();
  const { openSheet } = useTimetableNav();
  const { value, visible } = useFadingValue(count || null, 200);
  if (value === null) return null;
  return (
    <button
      type="button"
      aria-label={`${value} warnings`}
      aria-live="polite"
      onClick={() => openSheet("warnings")}
      className={cn(
        "relative inline-flex cursor-pointer items-center gap-1 rounded-full bg-brand-bg px-2 py-0.5 text-xs font-semibold text-brand",
        "after:absolute after:-inset-x-1 after:-inset-y-[13px] after:content-['']",
        "transition-[transform,opacity] duration-(--d-2) ease-(--e-out)",
        !visible && "pointer-events-none scale-90 opacity-0",
      )}
    >
      <AlertTriangle size={13} aria-hidden="true" />
      <Roll value={value} />
    </button>
  );
}

/** Desktop: the ⚠ count in the toolbar, listing the warnings in a popover. */
export function WarningsButton() {
  const summary = useWarningsSummary();
  const [open, setOpen] = useState(false);
  // don't come back already open after the warnings were all fixed
  if (summary.count === 0 && open) setOpen(false);
  if (summary.count === 0) return null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="tint"
          size="sm"
          aria-label={`${summary.count} warnings`}
          aria-live="polite"
        >
          <AlertTriangle aria-hidden="true" />
          <Roll value={summary.count} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-h-[70vh] w-[360px] overflow-y-auto p-3"
      >
        <p className="pb-2 text-[15px] font-semibold">{summary.title}</p>
        <WarningsList
          onNavigate={() => setOpen(false)}
          className="lg:[&>*]:mx-0"
        />
      </PopoverContent>
    </Popover>
  );
}

/** Desktop: rows (horizontal) or columns (vertical) grid. */
export function OrientationToggle() {
  const { orientation, toggle } = useOrientation();
  return (
    <Segmented
      size="sm"
      className="h-[38px] w-[84px]"
      aria-label="Orientation"
      value={orientation}
      onValueChange={(next) => {
        if (next !== orientation) toggle();
      }}
      options={[
        {
          value: "rows",
          label: <Rows3 size={16} aria-hidden="true" />,
          "aria-label": "Make timetable horizontal",
        },
        {
          value: "columns",
          label: <Columns3 size={16} aria-hidden="true" />,
          "aria-label": "Make timetable vertical",
        },
      ]}
    />
  );
}

export function PublishButton({ layout }: { layout: Layout }) {
  const {
    state: { coursesInTimetable },
  } = useTimetableState();
  const summary = useWarningsSummary();
  const { publish, intent } = useTimetableActions();
  const { openSheet } = useTimetableNav();
  const reasonId = useId();

  const blocked = summary.blocksPublish;
  const reason =
    coursesInTimetable.length === 0
      ? "Add a course before publishing"
      : "Complete the missing sections before publishing";
  const fade =
    "transition-[transform,background-color,opacity] duration-(--d-2)";
  const content = (
    <>
      <Send aria-hidden="true" />
      Publish
    </>
  );

  if (layout === "desktop") {
    if (!blocked)
      return (
        <Button
          variant="primary"
          size="sm"
          className={fade}
          onClick={publish}
          {...intent.publish}
        >
          {content}
        </Button>
      );
    return (
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <span
            // biome-ignore lint/a11y/noNoninteractiveTabindex: a disabled button gets no focus or hover, so its wrapper carries the tooltip
            tabIndex={0}
            className="cursor-not-allowed rounded-md"
          >
            <Button variant="primary" size="sm" disabled className={fade}>
              {content}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{reason}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      variant="primary"
      aria-disabled={blocked || undefined}
      aria-describedby={blocked ? reasonId : undefined}
      className={cn(fade, blocked && "opacity-45")}
      {...(blocked ? {} : intent.publish)}
      onClick={() => {
        if (!blocked) publish();
        // Blocked with no courses: the fix is adding one, even when CDCs are
        // missing too. Otherwise missing sections block it, and Warnings lists
        // them.
        else
          openSheet(coursesInTimetable.length === 0 ? "courses" : "warnings");
      }}
    >
      {content}
      {blocked && (
        <span id={reasonId} className="sr-only">
          {reason}
        </span>
      )}
    </Button>
  );
}

export function ExportButton({
  status,
  onExport,
  layout,
}: {
  status: ExportStatus;
  onExport: () => void;
  layout: Layout;
}) {
  const Icon =
    status === "rendering"
      ? LoaderCircle
      : status === "done"
        ? Check
        : Download;
  const button = (
    <Button
      variant="secondary"
      size={layout === "desktop" ? "sm" : "default"}
      disabled={status === "rendering"}
      onClick={onExport}
    >
      <span className="grid size-4 shrink-0 place-items-center">
        <Icon
          aria-hidden="true"
          className={cn("size-4", status === "rendering" && "animate-spin")}
        />
      </span>
      PNG
    </Button>
  );
  if (layout === "phone") return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>
        <p>Download timetable as image</p>
      </TooltipContent>
    </Tooltip>
  );
}

/** ⋯: Copy (phone), Edit (view page) and Delete, as the viewer may. */
export function MoreMenu({
  page,
  layout,
}: {
  page: "edit" | "view";
  layout: Layout;
}) {
  const {
    state: { user, timetable },
  } = useTimetableState();
  const { copy, edit, isEditing, intent } = useTimetableActions();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  if (timetable === undefined) return null;
  const isAuthor = user !== undefined && user.id === timetable.authorId;
  const showCopy = layout === "phone" && user !== undefined;
  const showEdit = page === "view" && isAuthor;
  if (!showCopy && !showEdit && !isAuthor) return null;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            ref={trigger}
            variant="secondary"
            size="icon"
            aria-label="More actions"
            className="shrink-0"
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {showCopy && (
            <DropdownMenuItem
              disabled={timetable.archived || isEditing}
              onSelect={copy}
              {...intent.copy}
            >
              <Copy />
              {timetable.archived
                ? "Cannot copy archived timetable"
                : "Copy Timetable"}
            </DropdownMenuItem>
          )}
          {showEdit && (
            <DropdownMenuItem
              disabled={timetable.archived || isEditing}
              onSelect={edit}
              {...intent.edit}
            >
              <Edit2 />
              {timetable.archived
                ? "Cannot edit archived timetable"
                : "Edit Timetable"}
            </DropdownMenuItem>
          )}
          {isAuthor && (
            <>
              {(showCopy || showEdit) && <DropdownMenuSeparator />}
              <DropdownMenuItem
                tone="danger"
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash />
                Delete Timetable
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {isAuthor && (
        <DeleteTimetableDialog
          timetableId={timetable.id}
          onDeleted={() => router.navigate({ to: "/" })}
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open);
            // opened from a menu item, so Radix has no trigger to refocus
            if (!open) setTimeout(() => trigger.current?.focus(), 50);
          }}
        />
      )}
    </>
  );
}

/** Desktop: Copy Timetable, disabled with master's reason when archived. */
export function CopyButton() {
  const {
    state: { user, timetable },
  } = useTimetableState();
  const { copy, isEditing } = useTimetableActions();
  if (timetable === undefined || user === undefined) return null;
  const button = (
    <Button
      variant="secondary"
      size="sm"
      disabled={timetable.archived || isEditing}
      onClick={copy}
    >
      <Copy aria-hidden="true" />
      Copy Timetable
    </Button>
  );
  if (!timetable.archived) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          // biome-ignore lint/a11y/noNoninteractiveTabindex: a disabled button gets no focus or hover, so its wrapper carries the tooltip
          tabIndex={0}
          className="cursor-not-allowed rounded-md"
        >
          {button}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>Cannot copy archived timetable</p>
      </TooltipContent>
    </Tooltip>
  );
}
