import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { crc32 } from "node:zlib";
import sharp from "sharp";
import { type Change, changesBetween, groupRepeats } from "./changes.js";
import { synthetics } from "./synthetics.js";

// compares a run's screenshots with the baseline (master's screenshots where
// a pull request branched off, or master's latest on master), and reports
// what changed in the step summary and, on a pull request, in one comment
// that's edited on every run.
//
// the images live in this repo under a ref that isn't a branch, so clones
// never download them, and get there with plain git rather than the api. that ref only ever moves forward, every image is named
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

const REF = `refs/${IMAGES_REF}`;
const git = (
  args: string[],
  options: { input?: string | Buffer; env?: Record<string, string> } = {},
) =>
  execFileSync("git", args, {
    input: options.input,
    env: { ...process.env, ...options.env },
    maxBuffer: 1 << 30,
    stdio: "pipe",
  });

// a file's bytes as of a commit. the store is fetched without file contents,
// so this downloads just the one file
const read = (commit: string, path: string) =>
  git(["ls-tree", "--full-tree", commit, "--", path]).length
    ? git(["cat-file", "blob", `${commit}:${path}`])
    : undefined;

const sha256 = (data: Buffer) =>
  createHash("sha256").update(data).digest("hex");

// a png's chunks, after its 8-byte signature
const chunks = (png: Buffer) => {
  const out: { type: string; data: Buffer }[] = [];
  for (let at = 8; at < png.length; ) {
    const length = png.readUInt32BE(at);
    out.push({
      type: png.toString("latin1", at + 4, at + 8),
      data: png.subarray(at + 8, at + 8 + length),
    });
    at += length + 12;
  }
  return out;
};
const chunk = (type: string, data: Buffer) => {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length);
  head.write(type, 4, "latin1");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])));
  return Buffer.concat([head, data, crc]);
};

// before and after as the two frames of an animated png that switches
// between them, so a change shows up as flicker. apng rather than webp or gif
// because raw.githubusercontent.com only serves .png as an image, and
// github's image proxy drops anything else. sharp can't write apng, so it
// encodes each frame and their image data is put into one file here. the
// smaller screenshot is padded with white to the larger. each frame gets a
// strip on top saying which one it is, above the screenshot rather than over
// it so it hides nothing
const BLINK_MS = 800;
const LABEL_HEIGHT = 32;
const LABELS = [
  { text: "before", background: "#57606a" },
  { text: "after", background: "#0969da" },
];
const label = (width: number, { text, background }: (typeof LABELS)[number]) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${LABEL_HEIGHT}">` +
      `<rect width="100%" height="100%" fill="${background}"/>` +
      `<text x="12" y="21" fill="#ffffff" font-family="sans-serif" font-size="15" font-weight="bold">${text}</text>` +
      "</svg>",
  );
const blinkImage = async (before: Buffer, after: Buffer) => {
  const sizes = await Promise.all(
    [before, after].map((png) => sharp(png).metadata()),
  );
  const width = Math.max(...sizes.map((size) => size.width));
  const height = LABEL_HEIGHT + Math.max(...sizes.map((size) => size.height));
  const frames = await Promise.all(
    [before, after].map(async (png, i) =>
      chunks(
        await sharp(png)
          .removeAlpha()
          .toColourspace("srgb")
          .extend({
            top: LABEL_HEIGHT,
            right: width - sizes[i].width,
            bottom: height - LABEL_HEIGHT - sizes[i].height,
            background: "#ffffff",
          })
          .composite([{ input: label(width, LABELS[i]), top: 0, left: 0 }])
          .png({ compressionLevel: 9 })
          .toBuffer(),
      ),
    ),
  );
  const [ihdr, otherIhdr] = frames.map(
    (frame) => frame.find(({ type }) => type === "IHDR")?.data as Buffer,
  );
  if (!ihdr.equals(otherIhdr)) throw new Error("blink frames don't match");
  let sequence = 0;
  const frameControl = () => {
    const data = Buffer.alloc(26);
    data.writeUInt32BE(sequence++);
    data.writeUInt32BE(width, 4);
    data.writeUInt32BE(height, 8);
    // offset 0,0, then the delay as a fraction of a second, then no disposal
    // and the frame replacing the last rather than drawn over it
    data.writeUInt16BE(BLINK_MS, 20);
    data.writeUInt16BE(1000, 22);
    return chunk("fcTL", data);
  };
  const animation = Buffer.alloc(8);
  animation.writeUInt32BE(frames.length);
  // and 0 plays, which loops forever
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("acTL", animation),
    ...frames.flatMap((frame, i) => [
      frameControl(),
      ...frame
        .filter(({ type }) => type === "IDAT")
        .map(({ data }) => {
          // the first frame is the png's own image, later ones are fdAT
          if (!i) return chunk("IDAT", data);
          const number = Buffer.alloc(4);
          number.writeUInt32BE(sequence++);
          return chunk("fdAT", Buffer.concat([number, data]));
        }),
    ]),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

type Manifest = Record<string, string>;

// the store's latest commit, fetched with its file list but no contents
const tip = () => {
  try {
    git([
      "fetch",
      "--quiet",
      "--depth=1",
      "--filter=blob:none",
      "origin",
      `+${REF}:${REF}`,
    ]);
  } catch (error) {
    const stderr = String((error as { stderr?: Buffer }).stderr);
    if (stderr.includes("couldn't find remote ref")) return undefined;
    throw error;
  }
  return { commit: git(["rev-parse", REF]).toString().trim() };
};

// the baseline as of the commit a pull request branched off master, so what
// master merged since isn't put on the pull request. master only makes a
// baseline when its screenshots change, so the newest one made from that
// commit or before it is exactly what master looked like there. this fetches
// the store's whole history, still without contents
const mergeBase = (head: string) => {
  try {
    git(["fetch", "--quiet", "--filter=blob:none", "origin", `+${REF}:${REF}`]);
  } catch (error) {
    const stderr = String((error as { stderr?: Buffer }).stderr);
    if (stderr.includes("couldn't find remote ref")) return undefined;
    throw error;
  }
  const base = git(["merge-base", head, "origin/master"]).toString().trim();
  for (const line of git(["log", "--format=%H %s", REF])
    .toString()
    .split("\n")) {
    // the pull requests' own screenshots are stored in between
    const [, commit, source] = line.match(/^(\w+) baseline from (\w+)$/) ?? [];
    if (!source) continue;
    try {
      git(["merge-base", "--is-ancestor", source, base]);
      return { commit };
    } catch {
      // made after the pull request branched off
    }
  }
  return undefined;
};

const readManifest = (commit: string | undefined): Manifest => {
  const file = commit && read(commit, "manifest.json");
  return file ? JSON.parse(file.toString()) : {};
};

// adds files on top of the store's tip in one push, retrying if another run
// moved it first. one push instead of an api call per image, which ran into
// github's limits on creating content. images are named after their hash, so
// any already stored are skipped. nothing is ever removed, so older links
// keep resolving
const BOT = {
  name: "github-actions[bot]",
  email: "41898282+github-actions[bot]@users.noreply.github.com",
};
const store = (files: Map<string, Buffer>, message: string) => {
  const blobs = [...files].map(([path, data]) => ({
    path,
    sha: git(["hash-object", "-w", "--stdin"], { input: data })
      .toString()
      .trim(),
  }));
  const dir = mkdtempSync(join(tmpdir(), "synthetics-"));
  const env = {
    GIT_INDEX_FILE: join(dir, "index"),
    GIT_AUTHOR_NAME: BOT.name,
    GIT_AUTHOR_EMAIL: BOT.email,
    GIT_COMMITTER_NAME: BOT.name,
    GIT_COMMITTER_EMAIL: BOT.email,
  };
  try {
    for (let attempt = 0; attempt < 10; attempt++) {
      const parent = tip();
      const stored = new Set(
        parent
          ? git(["ls-tree", "--full-tree", "-r", "--name-only", parent.commit])
              .toString()
              .split("\n")
          : [],
      );
      const fresh = blobs.filter(
        ({ path }) => path === "manifest.json" || !stored.has(path),
      );
      if (parent && !fresh.length) return parent.commit;
      rmSync(env.GIT_INDEX_FILE, { force: true });
      if (parent) git(["read-tree", parent.commit], { env });
      git(["update-index", "--index-info"], {
        env,
        input: fresh
          .map(({ path, sha }) => `100644 ${sha}\t${path}`)
          .join("\n"),
      });
      const tree = git(["write-tree"], { env }).toString().trim();
      const commit = git(
        [
          "commit-tree",
          tree,
          ...(parent ? ["-p", parent.commit] : []),
          "-m",
          message,
        ],
        { env },
      )
        .toString()
        .trim();
      try {
        git(["push", "--quiet", "origin", `${commit}:${REF}`]);
        return commit;
      } catch (error) {
        const stderr = String((error as { stderr?: Buffer }).stderr);
        if (!/rejected|fetch first|non-fast-forward/.test(stderr)) throw error;
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  throw new Error(`couldn't move ${REF}`);
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

const parent =
  BASELINE === "true" ? tip() : mergeBase(process.env.HEAD_SHA || "HEAD");
const baseline = readManifest(parent?.commit);
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
const blinks = new Map<string, string>();
const changes = new Map<string, Change[]>();
// master's report only goes to its step summary, the pull request already
// showed these changes, so it skips the slow part
const details = BASELINE !== "true";
await Promise.all(
  (details ? changed : []).map(async ([path, { data, hash }]) => {
    const name = `blink/${baseline[path]}-${hash}.png`;
    const before = read(parent?.commit as string, `img/${baseline[path]}.png`);
    if (!before)
      throw new Error(`no img/${baseline[path]}.png in refs/${IMAGES_REF}`);
    files.set(name, await blinkImage(before, data));
    blinks.set(path, name);
    changes.set(path, await changesBetween(before, data));
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
  ? store(
      files,
      BASELINE === "true"
        ? `baseline from ${process.env.GITHUB_SHA}`
        : `screenshots for #${PR_NUMBER} at ${process.env.HEAD_SHA}`,
    )
  : parent?.commit;

const url = (path: string) =>
  `https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/${commit}/${path}`;
// at its own size, or the comment's width if that's narrower
const image = (path: string) =>
  `<a href="${url(path)}"><img src="${url(path)}"></a>`;
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
// each screenshot under its own heading rather than in a table, which
// shrinks them to thumbnails
const section = <T>(
  items: T[],
  pathOf: (item: T) => string,
  imageOf: (item: T) => string,
  noteOf?: (item: T) => string,
) =>
  [...byRoute(items, pathOf)].flatMap(([route, group]) => [
    `### \`${route}\``,
    "",
    ...group.flatMap((item) => [
      `#### ${name(pathOf(item))}`,
      "",
      ...(noteOf ? [noteOf(item), ""] : []),
      image(imageOf(item)),
      "",
    ]),
  ]);

// changed screenshots that repeat changes already shown, or whose changes are
// all tiny, are folded away so a review only looks at each change once
const grouped = groupRepeats(
  [...byRoute(changed, ([path]) => path).values()]
    .flat()
    .map(([path]) => ({ item: path, changes: changes.get(path) ?? [] })),
);
const blinkOf = (path: string) => blinks.get(path) as string;

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
    );
  }
  if (details && changed.length) {
    lines.push(...section(grouped.shown, (path) => path, blinkOf));
  }
  if (details && grouped.repeats.length) {
    lines.push(
      `<details><summary>Same changes as above (${grouped.repeats.length})</summary>`,
      "",
      ...section(
        grouped.repeats,
        ({ item }) => item,
        ({ item }) => blinkOf(item),
        ({ of }) => `Repeats ${name(of)}`,
      ),
      "</details>",
      "",
    );
  }
  if (details && grouped.tiny.length) {
    lines.push(
      `<details><summary>Tiny changes, possibly noise (${grouped.tiny.length})</summary>`,
      "",
      ...section(grouped.tiny, (path) => path, blinkOf),
      "</details>",
      "",
    );
  }
  if (details && added.length) {
    lines.push(
      "<details><summary>New</summary>",
      "",
      ...section(
        added,
        ([path]) => path,
        ([, { hash }]) => `img/${hash}.png`,
      ),
      "</details>",
      "",
    );
  }
  if (details && removed.length) {
    lines.push(
      "<details><summary>Removed</summary>",
      "",
      ...section(
        removed,
        (path) => path,
        (path) => `img/${baseline[path]}.png`,
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
