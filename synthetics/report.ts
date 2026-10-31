import { createHash } from "node:crypto";
import { appendFileSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { synthetics } from "./synthetics.js";

// compares a run's screenshots with the baseline (master's latest), and
// reports what changed in the step summary and, on a pull request, in one
// comment that's edited on every run.
//
// the images live in this repo under a ref that isn't a branch, so clones
// never download them. that ref only ever moves forward, every image is named
// after its hash and every link pins a commit, so a report keeps showing
// exactly what it showed for as long as the repo exists

const {
  GITHUB_TOKEN,
  GITHUB_REPOSITORY,
  GITHUB_STEP_SUMMARY,
  PR_NUMBER,
  BASELINE,
  IMAGES_REF = "synthetics/images",
} = process.env;
const shotsDir = resolve(import.meta.dirname, "screenshots");
const MARKER = "<!-- synthetics-report -->";

const github = async <T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<{ status: number; data: T }> => {
  const url = path.startsWith("/repos/")
    ? path
    : `/repos/${GITHUB_REPOSITORY}${path}`;
  const res = await fetch(`https://api.github.com${url}`, {
    method: init.method ?? "GET",
    headers: {
      authorization: `Bearer ${GITHUB_TOKEN}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!res.ok && res.status !== 404 && res.status !== 422) {
    throw new Error(
      `${init.method ?? "GET"} ${url}: ${res.status} ${await res.text()}`,
    );
  }
  return { status: res.status, data: (await res.json()) as T };
};

// a file's bytes as of a commit
const read = async (commit: string, path: string) => {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPOSITORY}/contents/${path}?ref=${commit}`,
    {
      headers: {
        authorization: `Bearer ${GITHUB_TOKEN}`,
        accept: "application/vnd.github.raw",
        "x-github-api-version": "2022-11-28",
      },
    },
  );
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`reading ${path}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
};

const sha256 = (data: Buffer) =>
  createHash("sha256").update(data).digest("hex");

// the changed pixels in red over a faded copy of the new screenshot
const diffImage = async (before: Buffer, after: Buffer) => {
  const [a, b] = await Promise.all(
    [before, after].map((png) =>
      sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true }),
    ),
  );
  const width = Math.max(a.info.width, b.info.width);
  const height = Math.max(a.info.height, b.info.height);
  const out = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 3;
      const inA = x < a.info.width && y < a.info.height;
      const inB = x < b.info.width && y < b.info.height;
      const ia = (y * a.info.width + x) * 3;
      const ib = (y * b.info.width + x) * 3;
      const same =
        inA &&
        inB &&
        a.data[ia] === b.data[ib] &&
        a.data[ia + 1] === b.data[ib + 1] &&
        a.data[ia + 2] === b.data[ib + 2];
      if (same) {
        for (let c = 0; c < 3; c++)
          out[o + c] = 255 - (255 - b.data[ib + c]) / 4;
      } else {
        out[o] = 230;
        out[o + 1] = 30;
        out[o + 2] = 30;
      }
    }
  }
  return sharp(out, { raw: { width, height, channels: 3 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
};

type Manifest = Record<string, string>;

const tip = async () => {
  const ref = await github<{ object: { sha: string } }>(
    `/git/ref/${IMAGES_REF}`,
  );
  if (ref.status === 404) return undefined;
  const commit = await github<{ tree: { sha: string } }>(
    `/git/commits/${ref.data.object.sha}`,
  );
  return { commit: ref.data.object.sha, tree: commit.data.tree.sha };
};

const readManifest = async (commit: string | undefined): Promise<Manifest> => {
  const file = commit && (await read(commit, "manifest.json"));
  return file ? JSON.parse(file.toString()) : {};
};

// adds files on top of the ref's tip, retrying if another run moved it first.
// nothing is ever removed, so older links keep resolving
const store = async (files: Map<string, Buffer>, message: string) => {
  const tree = await Promise.all(
    [...files].map(async ([path, data]) => {
      const blob = await github<{ sha: string }>("/git/blobs", {
        method: "POST",
        body: { content: data.toString("base64"), encoding: "base64" },
      });
      return { path, mode: "100644", type: "blob", sha: blob.data.sha };
    }),
  );
  for (let attempt = 0; attempt < 10; attempt++) {
    const parent = await tip();
    const newTree = await github<{ sha: string }>("/git/trees", {
      method: "POST",
      body: { base_tree: parent?.tree, tree },
    });
    const commit = await github<{ sha: string }>("/git/commits", {
      method: "POST",
      body: {
        message,
        tree: newTree.data.sha,
        parents: parent ? [parent.commit] : [],
      },
    });
    const moved = parent
      ? await github(`/git/refs/${IMAGES_REF}`, {
          method: "PATCH",
          body: { sha: commit.data.sha, force: false },
        })
      : await github("/git/refs", {
          method: "POST",
          body: { ref: `refs/${IMAGES_REF}`, sha: commit.data.sha },
        });
    if (moved.status < 300) return commit.data.sha;
  }
  throw new Error(`couldn't move refs/${IMAGES_REF}`);
};

const shots = new Map(
  readdirSync(shotsDir, { recursive: true, encoding: "utf8" })
    .filter((path) => path.endsWith(".png"))
    .sort()
    .map((path) => {
      const data = readFileSync(resolve(shotsDir, path));
      return [path, { data, hash: sha256(data) }];
    }),
);

const parent = await tip();
const baseline = await readManifest(parent?.commit);
const noBaseline = BASELINE !== "true" && !Object.keys(baseline).length;
const changed = [...shots].filter(
  ([path, { hash }]) => baseline[path] && baseline[path] !== hash,
);
const added = [...shots].filter(([path]) => !baseline[path]);
const removed = Object.keys(baseline).filter((path) => !shots.has(path));
const unchanged = shots.size - changed.length - added.length;

const files = new Map<string, Buffer>();
for (const [, { data, hash }] of noBaseline ? [] : [...changed, ...added]) {
  files.set(`img/${hash}.png`, data);
}
const diffs = new Map<string, string>();
await Promise.all(
  changed.map(async ([path, { data, hash }]) => {
    const name = `diff/${baseline[path]}-${hash}.png`;
    const before = await read(
      parent?.commit as string,
      `img/${baseline[path]}.png`,
    );
    if (!before)
      throw new Error(`no img/${baseline[path]}.png in refs/${IMAGES_REF}`);
    files.set(name, await diffImage(before, data));
    diffs.set(path, name);
  }),
);
// a merge that changed no screenshot leaves the baseline alone
if (BASELINE === "true" && (changed.length || added.length || removed.length)) {
  const manifest = Object.fromEntries(
    [...shots].map(([path, { hash }]) => [path, hash]),
  );
  files.set(
    "manifest.json",
    Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`),
  );
}

const commit = files.size
  ? await store(
      files,
      BASELINE === "true"
        ? `baseline from ${process.env.GITHUB_SHA}`
        : `screenshots for #${PR_NUMBER} at ${process.env.HEAD_SHA}`,
    )
  : parent?.commit;

const url = (path: string) =>
  `https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/${commit}/${path}`;
const thumb = (path: string) =>
  `<a href="${url(path)}"><img src="${url(path)}" width="260"></a>`;
const name = (path: string) => {
  const [synthetic, device] = path.replace(/\.png$/, "").split("/");
  return `\`${synthetic}\` · ${device}`;
};

// screenshots grouped by the route their synthetic visits, with ids made
// generic so every timetable's edit page lands together. groups and rows keep
// the order of synthetics.ts
const routes = new Map(
  synthetics.map((synthetic, order) => [
    synthetic.name,
    {
      route: synthetic.url.replace(/\{[\w-]+\}/g, ":id").split("?")[0],
      order,
    },
  ]),
);
const byRoute = <T>(items: T[], pathOf: (item: T) => string) => {
  const of = (item: T) => routes.get(pathOf(item).split("/")[0]);
  const sorted = [...items].sort(
    (a, b) =>
      (of(a)?.order ?? routes.size) - (of(b)?.order ?? routes.size) ||
      pathOf(a).localeCompare(pathOf(b)),
  );
  const groups = new Map<string, T[]>();
  for (const item of sorted) {
    // a removed synthetic isn't in synthetics.ts anymore
    const route = of(item)?.route ?? "removed synthetics";
    groups.set(route, [...(groups.get(route) ?? []), item]);
  }
  return groups;
};
const section = <T>(
  items: T[],
  pathOf: (item: T) => string,
  header: string[],
  row: (item: T) => string[],
) =>
  [...byRoute(items, pathOf)].flatMap(([route, group]) => [
    `### \`${route}\``,
    "",
    `| ${header.join(" | ")} |`,
    `|${header.map(() => "---").join("|")}|`,
    ...group.map((item) => `| ${row(item).join(" | ")} |`),
    "",
  ]);

const lines = [MARKER, "## Screenshots", ""];
if (noBaseline) {
  lines.push("No baseline to compare against yet, it's made when master runs.");
} else if (!changed.length && !added.length && !removed.length) {
  lines.push(`No visual changes across ${shots.size} screenshots.`);
} else {
  lines.push(
    [
      changed.length && `**${changed.length} changed**`,
      added.length && `${added.length} new`,
      removed.length && `${removed.length} removed`,
      `${unchanged} unchanged`,
    ]
      .filter(Boolean)
      .join(" · "),
    "",
  );
  if (changed.length) {
    lines.push(
      [...byRoute(changed, ([path]) => path)]
        .map(([route, group]) => `\`${route}\` ${group.length}`)
        .join(" · "),
      "",
      ...section(
        changed,
        ([path]) => path,
        ["", "before", "after", "diff"],
        ([path, { hash }]) => [
          name(path),
          thumb(`img/${baseline[path]}.png`),
          thumb(`img/${hash}.png`),
          thumb(diffs.get(path) as string),
        ],
      ),
    );
  }
  if (added.length) {
    lines.push(
      "<details><summary>New</summary>",
      "",
      ...section(
        added,
        ([path]) => path,
        ["", "after"],
        ([path, { hash }]) => [name(path), thumb(`img/${hash}.png`)],
      ),
      "</details>",
      "",
    );
  }
  if (removed.length) {
    lines.push(
      "<details><summary>Removed</summary>",
      "",
      ...section(
        removed,
        (path) => path,
        ["", "before"],
        (path) => [name(path), thumb(`img/${baseline[path]}.png`)],
      ),
      "</details>",
      "",
    );
  }
}
const report = lines.join("\n");
if (GITHUB_STEP_SUMMARY) appendFileSync(GITHUB_STEP_SUMMARY, `${report}\n`);
console.log(report);

// one comment per pull request, edited in place. a pr that never changed a
// screenshot doesn't get one
if (PR_NUMBER) {
  type Comment = { id: number; body: string; user: { type: string } };
  let existing: Comment | undefined;
  for (let page = 1; !existing; page++) {
    const { data } = await github<Comment[]>(
      `/issues/${PR_NUMBER}/comments?per_page=100&page=${page}`,
    );
    existing = data.find(
      (c) => c.user.type === "Bot" && c.body.startsWith(MARKER),
    );
    if (data.length < 100) break;
  }
  if (existing) {
    await github(`/issues/comments/${existing.id}`, {
      method: "PATCH",
      body: { body: report },
    });
  } else if (
    !noBaseline &&
    (changed.length || added.length || removed.length)
  ) {
    await github(`/issues/${PR_NUMBER}/comments`, {
      method: "POST",
      body: { body: report },
    });
  }
}
