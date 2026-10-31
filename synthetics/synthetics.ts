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

// the desktop grid with days across; phones and tablets have no toggle
const vertical = async (page: Page) => {
  const toggle = page.getByLabel("Make timetable vertical");
  if (await toggle.isVisible()) await toggle.click();
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
      await page.getByText("Artificial Intelligence").first().click();
      await page
        .getByRole("heading", { name: "Artificial Intelligence" })
        .waitFor();
    },
  },
  {
    name: "edit-search-focus",
    as: "alice",
    url: "/edit/{alice-packed}",
    hide: ["navbar", "timetable-header", "grid"],
    act: async (page) => {
      await openMenu(page);
      await page.getByRole("searchbox", { name: "Search Courses" }).focus();
    },
  },
  {
    name: "edit-course-back-hover",
    as: "alice",
    url: "/edit/{alice-packed}",
    hide: ["navbar", "timetable-header", "grid"],
    act: async (page) => {
      await search(page, "CS F407");
      await page.getByText("Artificial Intelligence").first().click();
      await page
        .getByRole("heading", { name: "Artificial Intelligence" })
        .waitFor();
      await page.getByRole("button", { name: "Back" }).hover();
    },
  },
  // MEL G643 has the longest course name in the scenario, and no practical
  // yet so it shows up in the warnings too
  { name: "edit-long-course-name", as: "hd", url: "/edit/{hd-draft}" },
  {
    name: "edit-long-course-name-vertical",
    as: "hd",
    url: "/edit/{hd-draft}",
    hide: ["navbar", "side-menu"],
    act: vertical,
  },
  {
    name: "edit-long-course-name-courses",
    as: "hd",
    url: "/edit/{hd-draft}",
    hide: ["navbar", "timetable-header", "grid"],
    act: openMenu,
  },
  {
    name: "edit-long-course-name-picker",
    as: "hd",
    url: "/edit/{hd-draft}",
    hide: ["navbar", "timetable-header", "grid"],
    act: async (page) => {
      await openMenu(page);
      // the phone agenda behind the sheet has the code too
      await page
        .locator("[data-course-id]")
        .filter({ hasText: "MEL G643" })
        .first()
        .click();
      await page
        .getByRole("heading", { name: /^Verification, Test/ })
        .waitFor();
    },
  },
  {
    name: "edit-long-course-name-exams",
    as: "hd",
    url: "/edit/{hd-draft}",
    hide: ["navbar", "timetable-header", "grid"],
    act: async (page) => {
      await openTab(page, "Exams");
    },
  },
  {
    name: "edit-long-course-name-warnings",
    as: "hd",
    url: "/edit/{hd-draft}",
    hide: ["navbar", "grid"],
    act: async (page) => {
      await page.getByRole("button", { name: /warnings$/ }).click();
      await page.getByText("is missing a P section").first().waitFor();
    },
  },
  {
    name: "edit-courses",
    as: "alice",
    url: "/edit/{alice-packed}",
    hide: ["navbar", "timetable-header", "grid"],
    act: async (page) => {
      await openMenu(page);
    },
  },
  {
    name: "edit-course-added",
    as: "alice",
    url: "/edit/{alice-packed}",
    hide: ["navbar", "timetable-header", "grid"],
    act: async (page) => {
      await openMenu(page);
      await page.getByRole("button", { name: /^Object Oriented Prog/ }).click();
      await page
        .getByRole("button", { name: "Remove CS F213 from timetable" })
        .waitFor();
    },
  },
  {
    name: "edit-course-removed",
    as: "alice",
    url: "/edit/{alice-packed}",
    hide: ["navbar", "timetable-header", "grid"],
    act: async (page) => {
      // devices share the seeded timetable, so fake the removal
      let removed: string | undefined;
      await page.route("**/api/timetable/*/removeCourse", (route) => {
        removed = route.request().postDataJSON().courseId;
        return route.fulfill({
          json: { message: "course removed", sectionIds: [] },
        });
      });
      await page.route(/\/api\/timetable\/[^/]+$/, async (route) => {
        if (removed === undefined) return route.fallback();
        const response = await route.fetch();
        const timetable = await response.json();
        timetable.sections = timetable.sections.filter(
          (section: { courseId: string }) => section.courseId !== removed,
        );
        return route.fulfill({ response, json: timetable });
      });
      await openMenu(page);
      await page.getByRole("button", { name: /^Object Oriented Prog/ }).click();
      await page
        .getByRole("button", { name: "Remove CS F213 from timetable" })
        .click();
      await page.getByText("Added · 8", { exact: true }).waitFor();
      // hovering keeps the toast open for each theme's shot
      await page.getByText("Removed CS F213", { exact: true }).hover();
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
    // the downloaded png in each theme, shown in place of the page. vertical,
    // where the blocks have room for course names
    name: "view-export",
    as: "alice",
    url: "/view/{alice-public}",
    act: async (page) => {
      await vertical(page);
      const images: string[] = [];
      for (const theme of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme: theme });
        await page.waitForFunction(
          (theme) => document.documentElement.classList.contains(theme),
          theme,
        );
        const download = page.waitForEvent("download");
        await page.getByRole("button", { name: "PNG" }).first().click();
        const file = await (await download).createReadStream();
        const chunks: Buffer[] = [];
        for await (const chunk of file) chunks.push(chunk as Buffer);
        images.push(Buffer.concat(chunks).toString("base64"));
      }
      await page.emulateMedia({ colorScheme: "light" });
      const img = (png: string) =>
        `<img style="display:block;width:100%" src="data:image/png;base64,${png}">`;
      // both theme classes, so the runner's wait for each theme passes
      await page.setContent(
        `<html class="light dark"><body style="margin:0">${images.map(img).join("")}</body></html>`,
      );
    },
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
