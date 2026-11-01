import { createLazyRoute } from "@tanstack/react-router";
import type { timetableType } from "lib";
import { Plus } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { flushSync } from "react-dom";
import type { z } from "zod";
import { ButtonLabel } from "@/components/ButtonLabel";
import { EmptyBird } from "@/components/EmptyBird";
import {
  gridClass,
  HomeSkeleton,
  mainClass,
  overlineClass,
} from "@/components/HomeSkeleton";
import ReportIssue from "@/components/ReportIssue";
import useCreateTimetable from "@/data-access/hooks/useCreateTimetable";
import useUser from "@/data-access/hooks/useUser";
import { preloadEditorOnIntent } from "@/lib/preloadOnIntent";
import {
  getSharedTimetable,
  setSharedTimetable,
  subscribeSharedTimetable,
} from "@/lib/sharedTransition";
import { useSkeletonCrossfade } from "@/lib/skeletonFade";
import { cn } from "@/lib/utils";
import TimetableCard from "../components/TimetableCard";
import { Button } from "../components/ui/button";
import { router } from "../router";

type Timetable = z.infer<typeof timetableType>;

const byUpdated = (a: Timetable, b: Timetable) =>
  new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();

type SectionName = "drafts" | "published" | "archived";
type Leaving = Map<
  string,
  { timetable: Timetable; section: SectionName; index: number }
>;

// First-load stagger plays once per page load, not on back navigation.
let staggered = false;

// Where keyboard focus goes once a card is deleted: the next card, else the
// previous one, else the page heading. The order is read before the collapse.
function focusAfterDelete(id: string): () => void {
  const ids = [...document.querySelectorAll<HTMLElement>("[data-card-id]")].map(
    (el) => el.dataset.cardId ?? "",
  );
  const at = ids.indexOf(id);
  const candidates = [...ids.slice(at + 1), ...ids.slice(0, at).reverse()];
  return () => {
    const link = candidates
      .map((c) =>
        document.querySelector<HTMLElement>(
          `[data-card-id="${c}"] a[data-card-link]`,
        ),
      )
      .find((a) => a !== null && !a.closest("[inert]"));
    (link ?? document.getElementById("home-title"))?.focus();
  };
}

function useCollapsingCards(timetables: Timetable[] | undefined) {
  const [leaving, setLeaving] = useState<Leaving>(() => new Map());
  // Deleted ids stay out of the live lists until the ["user"] refetch drops
  // them, so a slow refetch can't bring a collapsed card back.
  const [deleted, setDeleted] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => {
    setDeleted((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set(
        [...prev].filter((id) => timetables?.some((t) => t.id === id)),
      );
      return next.size === prev.size ? prev : next;
    });
  }, [timetables]);
  const collapse = useCallback(
    (timetable: Timetable, section: SectionName, index: number) => {
      // Wait out the dialog's close and the card's own focus return to ⋯,
      // then move focus on unless the user has already put it elsewhere.
      const moveFocus = focusAfterDelete(timetable.id);
      setTimeout(() => {
        const active = document.activeElement;
        if (
          active === null ||
          active === document.body ||
          active.closest(`[data-card-id="${timetable.id}"], [role=alertdialog]`)
        )
          moveFocus();
      }, 80);
      setDeleted((prev) => new Set(prev).add(timetable.id));
      setLeaving((prev) =>
        new Map(prev).set(timetable.id, { timetable, section, index }),
      );
    },
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
  return { leaving, deleted, collapse, done };
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
        "grid transition-[grid-template-rows,opacity,scale] duration-(--d-2) ease-(--e-in)",
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
      <div
        data-card-id={id}
        className={cn("min-h-0", leaving && "overflow-hidden")}
      >
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

function Home() {
  const { data: user, isLoading, isError, error } = useUser();
  const { mutate: createTimetable, isPending: isCreating } =
    useCreateTimetable();
  useSkeletonCrossfade("home");

  const sharedId = useSyncExternalStore(
    subscribeSharedTimetable,
    getSharedTimetable,
  );
  const timetables = user?.timetables;
  const { leaving, deleted, collapse, done } = useCollapsingCards(timetables);
  const stagger = useRef(!staggered).current;
  const hasData = user !== undefined;
  useEffect(() => {
    if (hasData) staggered = true;
  }, [hasData]);

  const onOpen = (id: string) => {
    flushSync(() => setSharedTimetable(id));
  };

  const { drafts, published, archived } = useMemo(() => {
    const all = (timetables ?? []).filter((t) => !deleted.has(t.id));
    return {
      drafts: all.filter((t) => t.draft && !t.archived).sort(byUpdated),
      published: all.filter((t) => !t.draft && !t.archived).sort(byUpdated),
      archived: all.filter((t) => t.archived).sort(byUpdated),
    };
  }, [timetables, deleted]);

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
      {...preloadEditorOnIntent()}
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
      <h1
        id="home-title"
        tabIndex={-1}
        className="pt-2 text-2xl font-semibold outline-none lg:pt-10 lg:text-3xl"
      >
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
        </>
      )}
    </main>
  );
}

export const Route = createLazyRoute("/authenticated/")({
  component: Home,
});
