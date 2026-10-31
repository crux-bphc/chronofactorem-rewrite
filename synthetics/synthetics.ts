import type { Page } from "playwright";

// one synthetic = one screen worth looking at. Currently written for the starter-pack
// seed scenario. `as` is a user key from that scenario, or the email of someone
// who hasn't signed up yet (omit it to stay logged out), and `{key}` in the
// url becomes the id of that seeded timetable. `act` runs after the page
// settles, for screens that need interactions to reach. announcements default
// to read so their toast doesn't cover every screen, unless
// `unreadAnnouncements` is set
export type Synthetic = {
  name: string;
  as?: string;
  url: string;
  act?: (page: Page) => Promise<void>;
  unreadAnnouncements?: boolean;
};

// on phones the side menu tabs live behind a button
const openTab = async (page: Page, name: string) => {
  const menu = page.getByRole("button", { name: "Courses and exams" });
  const tab = page.getByRole("tab", { name });
  await menu.or(tab).first().waitFor();
  if (await menu.isVisible()) await menu.click();
  await tab.click();
};

export const synthetics: Synthetic[] = [
  { name: "login", url: "/login" },
  { name: "about", url: "/about" },
  { name: "not-found", url: "/this-page-does-not-exist" },
  {
    name: "get-degrees",
    as: "f20260004@hyderabad.bits-pilani.ac.in",
    url: "/getDegrees?year=1",
  },

  { name: "home", as: "alice", url: "/", unreadAnnouncements: true },
  { name: "home-empty", as: "esha", url: "/" },
  { name: "home-higher-degree", as: "hd", url: "/" },
  { name: "edit-profile", as: "alice", url: "/editProfile" },

  { name: "edit-empty", as: "alice", url: "/edit/{alice-empty}" },
  { name: "edit-warnings", as: "alice", url: "/edit/{alice-warnings}" },
  { name: "edit-packed", as: "alice", url: "/edit/{alice-packed}" },
  { name: "edit-long-name", as: "alice", url: "/edit/{alice-long-name}" },
  { name: "edit-dual-degree", as: "bob", url: "/edit/{bob-draft}" },
  { name: "edit-higher-degree", as: "hd", url: "/edit/{hd-draft}" },
  {
    name: "edit-search",
    as: "alice",
    url: "/edit/{alice-packed}",
    act: async (page) => {
      await openTab(page, "Search");
      await page.getByPlaceholder("Search Courses").fill("CS F");
    },
  },
  {
    name: "edit-course-clashes",
    as: "alice",
    url: "/edit/{alice-packed}",
    act: async (page) => {
      await openTab(page, "Search");
      await page.getByPlaceholder("Search Courses").fill("CS F407");
      await page.getByText("CS F407").first().click();
      await page.getByText("CS F407: ").waitFor();
    },
  },
  {
    name: "edit-exams",
    as: "alice",
    url: "/edit/{alice-packed}",
    act: async (page) => {
      await openTab(page, "Exams");
    },
  },
  { name: "finalize", as: "alice", url: "/finalize/{alice-packed}" },

  { name: "view-own", as: "alice", url: "/view/{alice-public}" },
  { name: "view-someone-else", as: "bob", url: "/view/{alice-public}" },
  { name: "view-logged-out", url: "/view/{alice-public}" },
  { name: "view-private-by-link", as: "bob", url: "/view/{alice-private}" },
  { name: "view-draft-blocked", as: "bob", url: "/view/{alice-warnings}" },
  { name: "view-archived", as: "alice", url: "/view/{alice-archived}" },
  { name: "view-dual-degree", as: "bob", url: "/view/{bob-public}" },
];
