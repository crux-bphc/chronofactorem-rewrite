import { Route } from "@tanstack/react-router";
import type { timetableType } from "lib";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { z } from "zod";
import { BottomBar } from "@/components/BottomBar";
import { ButtonLabel } from "@/components/ButtonLabel";
import { EmptyBird } from "@/components/EmptyBird";
import ReportIssue from "@/components/ReportIssue";
import { Skeleton } from "@/components/ui/skeleton";
import { handleLoginRedirect } from "@/data-access/errors/handlers";
import toastHandler from "@/data-access/errors/toastHandler";
import useCreateTimetable from "@/data-access/hooks/useCreateTimetable";
import useUser, { userQueryOptions } from "@/data-access/hooks/useUser";
import { getSharedTimetable, setSharedTimetable } from "@/lib/sharedTransition";
import { cn } from "@/lib/utils";
import authenticatedRoute from "../AuthenticatedRoute";
import TimetableCard from "../components/TimetableCard";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import { router } from "../router";

type Timetable = z.infer<typeof timetableType>;

const mainClass =
  "mx-auto w-full max-w-[640px] px-4 pb-28 lg:max-w-[1100px] lg:px-7 lg:pb-12";
const gridClass = "grid gap-2 lg:grid-cols-3 lg:gap-3.5";
const overlineClass =
  "mt-5 mb-2 text-xs font-semibold tracking-[.07em] text-ink-muted uppercase lg:mt-7 lg:mb-2.5";

const byUpdated = (a: Timetable, b: Timetable) =>
  new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();

type SectionName = "drafts" | "published" | "archived";
type Leaving = Map<
  string,
  { timetable: Timetable; section: SectionName; index: number }
>;

// First-load stagger plays once per page load, not on back navigation.
let staggered = false;

function useCollapsingCards() {
  const [leaving, setLeaving] = useState<Leaving>(() => new Map());
  const collapse = useCallback(
    (timetable: Timetable, section: SectionName, index: number) =>
      setLeaving((prev) =>
        new Map(prev).set(timetable.id, { timetable, section, index }),
      ),
    [],
  );
  const done = useCallback(
    (id: string) =>
      setLeaving((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Map(prev);
        next.delete(id);
        return next;
      }),
    [],
  );
  return { leaving, collapse, done };
}

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const CollapsingCard = ({
  id,
  leaving,
  done,
  children,
}: {
  id: string;
  leaving: boolean;
  done: (id: string) => void;
  children: React.ReactNode;
}) => {
  useEffect(() => {
    if (!leaving) return;
    if (prefersReducedMotion()) {
      done(id);
      return;
    }
    const timer = setTimeout(() => done(id), 260);
    return () => clearTimeout(timer);
  }, [leaving, id, done]);

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity,transform] duration-(--d-2) ease-(--e-in)",
        leaving ? "grid-rows-[0fr] opacity-0 scale-[.96]" : "grid-rows-[1fr]",
      )}
      inert={leaving}
      aria-hidden={leaving || undefined}
      onTransitionEnd={(e) => {
        if (
          leaving &&
          e.target === e.currentTarget &&
          e.propertyName === "grid-template-rows"
        )
          done(id);
      }}
    >
      <div className={cn("min-h-0", leaving && "overflow-hidden")}>
        {children}
      </div>
    </div>
  );
};

const TimetableSection = ({
  id,
  title,
  section,
  live,
  leaving,
  startIndex,
  sharedId,
  stagger,
  onOpen,
  collapse,
  done,
}: {
  id: string;
  title: string;
  section: SectionName;
  live: Timetable[];
  leaving: Leaving;
  startIndex: number;
  sharedId: string | null;
  stagger: boolean;
  onOpen: (id: string) => void;
  collapse: (t: Timetable, section: SectionName, index: number) => void;
  done: (id: string) => void;
}) => {
  const list = [...live];
  for (const entry of leaving.values()) {
    if (
      entry.section !== section ||
      live.some((t) => t.id === entry.timetable.id)
    )
      continue;
    list.splice(Math.min(entry.index, list.length), 0, entry.timetable);
  }
  if (list.length === 0) return null;

  return (
    <section aria-labelledby={id}>
      <h2 id={id} className={overlineClass}>
        {title} · {live.length}
      </h2>
      <div className={gridClass}>
        {list.map((timetable, i) => (
          <CollapsingCard
            key={timetable.id}
            id={timetable.id}
            leaving={leaving.has(timetable.id)}
            done={done}
          >
            <TimetableCard
              timetable={timetable}
              shared={sharedId === timetable.id}
              onOpen={onOpen}
              onDeleted={() => collapse(timetable, section, i)}
              className={
                stagger
                  ? "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-(--d-2) ease-(--e-out)"
                  : undefined
              }
              style={
                stagger
                  ? { animationDelay: `${Math.min(startIndex + i, 5) * 30}ms` }
                  : undefined
              }
            />
          </CollapsingCard>
        ))}
      </div>
    </section>
  );
};

function HomeSkeleton() {
  return (
    <main className={mainClass} aria-busy="true">
      <h1 className="pt-2 text-2xl font-semibold lg:pt-10 lg:text-3xl">
        Timetables
      </h1>
      <Skeleton className="mt-5 mb-2 h-3 w-20 lg:mt-7 lg:mb-2.5" />
      <div className={gridClass}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
          >
            <Skeleton className="h-16 w-[92px] shrink-0 rounded-[8px]" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

const homeRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "/",
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(userQueryOptions).catch((error) => {
      handleLoginRedirect(error);
      throw error;
    }),
  component: Home,
  pendingComponent: HomeSkeleton,
  errorComponent: ({ error }) => {
    const { toast } = useToast();
    toastHandler(error, toast);
  },
});

function Home() {
  const { data: user, isLoading, isError, error } = useUser();
  const { mutate: createTimetable, isPending: isCreating } =
    useCreateTimetable();

  const [sharedId, setSharedId] = useState(getSharedTimetable);
  const { leaving, collapse, done } = useCollapsingCards();
  const stagger = useRef(!staggered).current;
  const hasData = user !== undefined;
  useEffect(() => {
    if (hasData) staggered = true;
  }, [hasData]);

  const onOpen = (id: string) => {
    setSharedTimetable(id);
    flushSync(() => setSharedId(id));
  };

  const timetables = user?.timetables;
  const { drafts, published, archived } = useMemo(() => {
    const all = timetables ?? [];
    return {
      drafts: all.filter((t) => t.draft && !t.archived).sort(byUpdated),
      published: all.filter((t) => !t.draft && !t.archived).sort(byUpdated),
      archived: all.filter((t) => t.archived).sort(byUpdated),
    };
  }, [timetables]);

  if (isLoading) {
    return <HomeSkeleton />;
  }

  if (isError || user === undefined) {
    return (
      <ReportIssue
        error={error ? JSON.stringify(error.message) : "user is undefined"}
      />
    );
  }

  const create = () =>
    createTimetable(void null, {
      onSuccess: (_response) => {
        router.navigate({
          to: "/edit/$timetableId",
          params: { timetableId: _response.data.id },
        });
      },
    });

  const createButton = (className?: string) => (
    <Button
      className={className}
      aria-busy={isCreating}
      disabled={isCreating}
      onClick={create}
    >
      <ButtonLabel loading={isCreating}>
        <Plus />
        Create a timetable
      </ButtonLabel>
    </Button>
  );

  const isEmpty =
    drafts.length === 0 &&
    published.length === 0 &&
    archived.length === 0 &&
    leaving.size === 0;
  const sectionProps = { leaving, sharedId, stagger, onOpen, collapse, done };
  const countIn = (name: SectionName, live: Timetable[]) =>
    live.length +
    [...leaving.values()].filter(
      (l) => l.section === name && !live.some((t) => t.id === l.timetable.id),
    ).length;
  const draftsAt = 0;
  const publishedAt = countIn("drafts", drafts);
  const archivedAt = publishedAt + countIn("published", published);

  return (
    <main className={mainClass}>
      <h1 className="pt-2 text-2xl font-semibold lg:pt-10 lg:text-3xl">
        Timetables
      </h1>
      {isEmpty ? (
        <div className="flex flex-col items-center pt-24 lg:pt-28">
          <EmptyBird />
          <h2 className="mt-5 text-xl font-semibold">It's empty in here.</h2>
          {createButton("mt-6 w-full max-w-[310px]")}
        </div>
      ) : (
        <>
          <TimetableSection
            id="drafts"
            title="Drafts"
            section="drafts"
            live={drafts}
            startIndex={draftsAt}
            {...sectionProps}
          />
          <TimetableSection
            id="published"
            title="Published"
            section="published"
            live={published}
            startIndex={publishedAt}
            {...sectionProps}
          />
          <TimetableSection
            id="archived"
            title="Archived"
            section="archived"
            live={archived}
            startIndex={archivedAt}
            {...sectionProps}
          />
          <BottomBar className="lg:hidden">{createButton()}</BottomBar>
        </>
      )}
    </main>
  );
}

export default homeRoute;
