import type { Page } from "playwright";

// one synthetic = one screen worth looking at. Currently written for the starter-pack
// seed scenario. `as` is a user key from that scenario, or the email of someone
// who hasn't signed up yet (omit it to stay logged out), and `{key}` in the
// url becomes the id of that seeded timetable. `act` runs after the page
// settles, for screens that need interactions to reach. announcements default
// to read so their toast doesn't cover every screen, unless
// `unreadAnnouncements` is set. `hide` covers parts that are on screen but not
// what the synthetic is about, see `Part`
export type Synthetic = {
  name: string;
  as?: string;
  url: string;
  act?: (page: Page) => Promise<void>;
  unreadAnnouncements?: boolean;
  hide?: Part[];
};

// parts that show up on most screens, marked with data-shot in the frontend
// ("grid" covers the phone day and week controls too).
// each is left visible on a few synthetics that are about it and hidden
// behind a hatch everywhere else, so a change to one only touches its own
// synthetics' screenshots instead of most of them. a new synthetic that hides
// nothing is always safe, it just shows more
export type Part = "navbar" | "timetable-header" | "grid" | "side-menu";

// on phones the side menu lives behind a button
const openMenu = async (page: Page) => {
  const menu = page.getByRole("button", { name: "Courses and exams" });
  const tabs = page.getByRole("tablist", { name: "Timetable details" });
  await menu.or(tabs).first().waitFor();
  if (await menu.isVisible()) await menu.click();
};

const openTab = async (page: Page, name: string) => {
  await openMenu(page);
  await page.getByRole("tab", { name }).click();
};

// the search box is debounced into ?q=, and the results only filter once
// that lands
const search = async (page: Page, term: string) => {
  await openMenu(page);
  await page.getByRole("searchbox", { name: "Search Courses" }).fill(term);
  await page.waitForURL((url) => url.searchParams.get("q") === term);
};

export const synthetics: Synthetic[] = [
  { name: "login", url: "/login" },
  { name: "about", url: "/about" },
  { name: "not-found", url: "/this-page-does-not-exist", hide: ["navbar"] },
  {
    name: "get-degrees",
    as: "f20260004@hyderabad.bits-pilani.ac.in",
    url: "/getDegrees?year=1",
  },

  { name: "home", as: "alice", url: "/", unreadAnnouncements: true },
  { name: "home-empty", as: "esha", url: "/", hide: ["navbar"] },
  { name: "home-higher-degree", as: "hd", url: "/", hide: ["navbar"] },
  { name: "edit-profile", as: "alice", url: "/editProfile", hide: ["navbar"] },

  {
    name: "edit-empty",
    as: "alice",
    url: "/edit/{alice-empty}",
    hide: ["navbar", "timetable-header"],
  },
  {
    name: "edit-warnings",
    as: "alice",
    url: "/edit/{alice-warnings}",
    hide: ["navbar", "grid"],
  },
  { name: "edit-packed", as: "alice", url: "/edit/{alice-packed}" },
  {
    name: "edit-long-name",
    as: "alice",
    url: "/edit/{alice-long-name}",
    hide: ["navbar", "grid", "side-menu"],
  },
  {
    name: "edit-dual-degree",
    as: "bob",
    url: "/edit/{bob-draft}",
    hide: ["navbar", "grid"],
  },
  {
    name: "edit-higher-degree",
    as: "hd",
    url: "/edit/{hd-draft}",
    hide: ["navbar", "grid"],
  },
  {
    name: "edit-search",
    as: "alice",
    url: "/edit/{alice-packed}",
    hide: ["navbar", "timetable-header", "grid"],
    act: async (page) => {
      await search(page, "CS F");
    },
  },
  {
    name: "edit-course-clashes",
    as: "alice",
    url: "/edit/{alice-packed}",
    hide: ["navbar", "timetable-header", "grid"],
    act: async (page) => {
      await search(page, "CS F407");
      await page.getByText("CS F407").first().click();
      await page.getByRole("heading", { name: "CS F407" }).waitFor();
    },
  },
  {
    name: "edit-exams",
    as: "alice",
    url: "/edit/{alice-packed}",
    hide: ["navbar", "timetable-header", "grid"],
    act: async (page) => {
      await openTab(page, "Exams");
    },
  },
  {
    name: "finalize",
    as: "alice",
    url: "/finalize/{alice-packed}",
    hide: ["navbar"],
  },

  {
    name: "view-own",
    as: "alice",
    url: "/view/{alice-public}",
    hide: ["navbar"],
  },
  {
    name: "view-someone-else",
    as: "bob",
    url: "/view/{alice-public}",
    hide: ["navbar", "grid", "side-menu"],
  },
  {
    name: "view-logged-out",
    url: "/view/{alice-public}",
    hide: ["grid", "side-menu"],
  },
  {
    name: "view-private-by-link",
    as: "bob",
    url: "/view/{alice-private}",
    hide: ["navbar", "grid", "side-menu"],
  },
  {
    name: "view-draft-blocked",
    as: "bob",
    url: "/view/{alice-warnings}",
    hide: ["navbar"],
  },
  {
    name: "view-archived",
    as: "alice",
    url: "/view/{alice-archived}",
    hide: ["navbar", "grid", "side-menu"],
  },
];
