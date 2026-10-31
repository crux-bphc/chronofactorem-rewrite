import type { announcementWithIDType } from "lib";
import { ChevronRight, Megaphone } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import useAnnouncements from "@/data-access/hooks/useAnnouncements";
import { useSkeletonFadeIn } from "@/lib/skeletonFade";
import { useAnnouncementsSheet } from "@/lib/useAnnouncementsSheet";
import { useIsDesktop } from "@/lib/useIsDesktop";
import { cn } from "@/lib/utils";
import ReportIssue from "./ReportIssue";
import { Button } from "./ui/button";
import { ToastAction } from "./ui/toast";

type Announcement = z.infer<typeof announcementWithIDType>;

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const time = (a: Announcement) =>
  a.createdAt ? new Date(a.createdAt).getTime() : 0;

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function AnnouncementGroup({
  label,
  count,
  defaultOpen,
  children,
}: {
  label: "Unread" | "Read";
  count: number;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const regionId = useId();
  return (
    <section>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 items-center gap-2 text-base font-semibold"
      >
        <ChevronRight
          aria-hidden="true"
          className={cn(
            "size-4 text-ink-muted transition-transform duration-(--d-2)",
            open && "rotate-90",
          )}
        />
        <span>
          {label} ·{" "}
          <span
            key={count}
            className="inline-block animate-in fade-in slide-in-from-bottom-1 duration-(--d-2)"
          >
            {count}
          </span>
        </span>
      </button>
      <div
        id={regionId}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows] duration-(--d-2) ease-(--e-out)",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </section>
  );
}

function Announcements() {
  const { toast, dismiss } = useToast();
  const { data: announcements, isLoading, isError, error } = useAnnouncements();
  const { open, show, hide } = useAnnouncementsSheet();
  const isDesktop = useIsDesktop();
  // only a skeleton someone saw fades: the list usually loads before the
  // sheet is opened
  const fadeIn = useSkeletonFadeIn(isLoading && open);
  const [readAnnouncements, setReadAnnouncements] = useState<string[]>(() => {
    try {
      const value = JSON.parse(
        localStorage.getItem("readAnnouncements") ?? "[]",
      );
      return Array.isArray(value)
        ? [
            ...new Set(
              value.filter((item): item is string => typeof item === "string"),
            ),
          ]
        : [];
    } catch {
      return [];
    }
  });
  // Items sliding out of Unread, and items read this session (their Read rows
  // fade in rather than appearing).
  const [leaving, setLeaving] = useState<Set<string>>(() => new Set());
  const [justRead, setJustRead] = useState<Set<string>>(() => new Set());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    localStorage.setItem(
      "readAnnouncements",
      JSON.stringify(readAnnouncements),
    );
  }, [readAnnouncements]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const t of pending.values()) clearTimeout(t);
    };
  }, []);

  const markAsRead = (id: string) => {
    setReadAnnouncements((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const markAllAsRead = () => {
    setReadAnnouncements((prev) => [
      ...prev,
      ...(announcements ?? [])
        .map((announcement) => announcement.id)
        .filter((id) => !prev.includes(id)),
    ]);
  };

  const finishLeaving = (id: string) => {
    const timer = timers.current.get(id);
    if (timer === undefined) return;
    clearTimeout(timer);
    timers.current.delete(id);
    markAsRead(id);
    setLeaving((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const startMarkAsRead = (id: string) => {
    setJustRead((prev) => new Set(prev).add(id));
    if (reducedMotion()) {
      markAsRead(id);
      return;
    }
    if (timers.current.has(id)) return;
    timers.current.set(
      id,
      setTimeout(() => finishLeaving(id), 240),
    );
    setLeaving((prev) => new Set(prev).add(id));
  };

  const notifiedAnnouncements = useRef(new Set<string>());
  const toastId = useRef<string | undefined>(undefined);

  // The open sheet already shows everything; don't leave a toast over it.
  // Dismiss once: `dismiss` is a new function every render, and dispatching
  // again would re-render this component and loop.
  useEffect(() => {
    if (open && toastId.current) {
      dismiss(toastId.current);
      toastId.current = undefined;
    }
  }, [open, dismiss]);

  useEffect(() => {
    const unreadAnnouncements =
      announcements?.filter(
        (announcement) => !readAnnouncements.includes(announcement.id),
      ) ?? [];
    const hasNewUnread = unreadAnnouncements.some(
      (announcement) => !notifiedAnnouncements.current.has(announcement.id),
    );

    if (hasNewUnread) {
      for (const announcement of unreadAnnouncements) {
        notifiedAnnouncements.current.add(announcement.id);
      }
      if (open) return;
      toastId.current = toast({
        title: "New Announcements",
        description: `You have ${
          unreadAnnouncements.length
        } unread announcement${unreadAnnouncements.length > 1 ? "s" : ""}.`,
        action: (
          <ToastAction
            altText="Mark all announcements as read"
            onClick={markAllAsRead}
          >
            Mark all as read
          </ToastAction>
        ),
      }).id;
    }
  }, [announcements, readAnnouncements, toast, open]);

  const sorted = [...(announcements ?? [])].sort((a, b) => time(b) - time(a));
  const unread = sorted.filter((a) => !readAnnouncements.includes(a.id));
  const read = sorted.filter((a) => readAnnouncements.includes(a.id));
  const hasUnread = unread.length > 0;

  const item = (announcement: Announcement, isUnread: boolean) => {
    const isLeaving = leaving.has(announcement.id);
    return (
      <div
        key={announcement.id}
        onTransitionEnd={
          isLeaving
            ? (e) => {
                if (e.target === e.currentTarget)
                  finishLeaving(announcement.id);
              }
            : undefined
        }
        className={cn(
          "px-3.5 py-3.5",
          isLeaving &&
            "pointer-events-none translate-x-3 opacity-0 transition-[opacity,translate] duration-(--d-2) ease-(--e-in)",
          !isUnread &&
            justRead.has(announcement.id) &&
            "animate-in fade-in slide-in-from-top-1 duration-(--d-2)",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold">{announcement.title}</h3>
          {announcement.createdAt && (
            <span className="whitespace-nowrap text-sm text-ink-muted">
              {dateFormat.format(new Date(announcement.createdAt))}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm leading-[1.45] text-ink-muted">
          {announcement.message}
        </p>
        {isUnread && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-2.5"
            onClick={() => startMarkAsRead(announcement.id)}
          >
            Mark as Read
          </Button>
        )}
      </div>
    );
  };

  const list = (items: Announcement[], isUnread: boolean) => (
    <div className="divide-y divide-line rounded-xl border border-line bg-surface">
      {items.map((a) => item(a, isUnread))}
    </div>
  );

  const body = isLoading ? (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
    </div>
  ) : isError ? (
    <ReportIssue error={JSON.stringify(error)} />
  ) : sorted.length === 0 ? (
    <p
      className={cn("py-8 text-center text-ink-muted", fadeIn.className)}
      onAnimationEnd={fadeIn.onAnimationEnd}
    >
      No announcements
    </p>
  ) : (
    <div
      className={cn("flex flex-col gap-1", fadeIn.className)}
      onAnimationEnd={fadeIn.onAnimationEnd}
    >
      {hasUnread && (
        <Button
          variant="secondary"
          size="sm"
          className="mb-1 self-start"
          onClick={markAllAsRead}
        >
          Mark all as read
        </Button>
      )}
      {unread.length > 0 && (
        <AnnouncementGroup label="Unread" count={unread.length} defaultOpen>
          {list(unread, true)}
        </AnnouncementGroup>
      )}
      {read.length > 0 && (
        <AnnouncementGroup label="Read" count={read.length} defaultOpen={false}>
          {list(read, false)}
        </AnnouncementGroup>
      )}
    </div>
  );

  const onOpenChange = (o: boolean) => {
    if (!o) hide();
  };

  return (
    <>
      <Button
        aria-label={hasUnread ? "Announcements, unread" : "Announcements"}
        variant="quiet"
        size="icon"
        className="relative"
        onClick={show}
      >
        <Megaphone className="size-5 lg:size-[18px]" />
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1 right-1 size-2 rounded-full bg-now ring-2 ring-bg transition-[scale,opacity] duration-(--d-2) ease-(--e-out)",
            hasUnread ? "scale-100 opacity-100" : "scale-0 opacity-0",
          )}
        />
      </Button>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent
            aria-describedby={undefined}
            className="max-h-[80dvh] max-w-[480px] overflow-y-auto"
          >
            <DialogHeader>
              <DialogTitle>Announcements</DialogTitle>
            </DialogHeader>
            {body}
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent className="max-h-[85dvh]">
            <SheetHeader title="Announcements" />
            <div className="overflow-y-auto px-4 pb-2">{body}</div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}

export default Announcements;
