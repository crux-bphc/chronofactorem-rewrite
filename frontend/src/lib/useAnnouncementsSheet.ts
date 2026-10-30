import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import type { RootSearch } from "./rootSearch";

type RootSheetState = { chronoNav?: boolean; rootSheet?: string };

/**
 * The announcements sheet lives in a root-level `sheet=announcements` param,
 * so it opens on any page and the back button closes it. Opening pushes an
 * entry; closing pops it when it is ours, otherwise (deep link, reload) strips
 * the param in place.
 */
export function useAnnouncementsSheet() {
  const search = useSearch({ strict: false }) as RootSearch;
  const navigate = useNavigate();
  const router = useRouter();
  const open = search.sheet === "announcements";

  const show = useCallback(() => {
    if (router.latestLocation.search.sheet === "announcements") return;
    // biome-ignore lint/suspicious/noExplicitAny: shared by every route
    (navigate as any)({
      search: (p: RootSearch) => ({ ...p, sheet: "announcements" }),
      state: { chronoNav: true, rootSheet: "announcements" },
      resetScroll: false,
    });
  }, [navigate, router]);

  const hide = useCallback(() => {
    const loc = router.state.location;
    if (loc.search.sheet !== "announcements") return;
    if ((loc.state as RootSheetState).rootSheet === "announcements") {
      router.history.back();
      return;
    }
    // biome-ignore lint/suspicious/noExplicitAny: shared by every route
    (navigate as any)({
      search: ({ sheet: _s, ...rest }: RootSearch) => rest,
      replace: true,
      resetScroll: false,
    });
  }, [navigate, router]);

  return useMemo(() => ({ open, show, hide }), [open, show, hide]);
}
