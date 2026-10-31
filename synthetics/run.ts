import { type ChildProcess, spawn } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import { rmSync } from "node:fs";
import { availableParallelism } from "node:os";
import { resolve } from "node:path";
import pg from "pg";
import { chromium, devices, type Page } from "playwright";
import { build, preview } from "vite";
import scenario from "../backend/src/seed/scenarios/starter-pack.json" with {
  type: "json",
};
import { synthetics } from "./synthetics.js";

const root = resolve(import.meta.dirname, "..");
const backendDir = resolve(root, "backend");
const frontendDir = resolve(root, "frontend");
const outDir = resolve(import.meta.dirname, "screenshots");

const BACKEND_PORT = 3999;
const FRONTEND_PORT = 4999;
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;
const API = `http://localhost:${BACKEND_PORT}`;

// the browser clock; the scenario pins every timestamp in the database
const NOW = new Date("2026-10-14T10:30:00+05:30");

// real device presets (viewport, touch, mobile layout), plus the two most
// common desktop resolutions. everything renders at 1x to keep pngs small
const DEVICES = {
  "iphone-15": devices["iPhone 15"],
  "pixel-7": devices["Pixel 7"],
  "ipad-mini": devices["iPad Mini"],
  "laptop-1366": { viewport: { width: 1366, height: 768 } },
  "desktop-1920": { viewport: { width: 1920, height: 1080 } },
};
const THEMES = ["light", "dark"] as const;

const DB_NAME = "chrono_synthetics";
const server = {
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.PGPORT ?? 5432),
};
const admin = {
  ...server,
  user: process.env.POSTGRES_USER ?? "chrono",
  password: process.env.POSTGRES_PASSWORD ?? "chrono",
  database: "postgres",
};
// the backend ignores POSTGRES_DB and always lands in the database named
// after its user, so the run gets a user of its own
const db = { ...server, user: DB_NAME, password: DB_NAME, database: DB_NAME };

const keys = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
});
const backendEnv = {
  ...process.env,
  NODE_ENV: "development",
  LOGIN_AS: "true",
  LOG_LEVEL: "warn",
  POSTGRES_USER: db.user,
  POSTGRES_PASSWORD: db.password,
  POSTGRES_DB: DB_NAME,
  DB_HOST: db.host,
  PGPORT: String(db.port),
  BACKEND_PORT: String(BACKEND_PORT),
  BACKEND_URL: `${FRONTEND_URL}/api`,
  FRONTEND_URL,
  LOGTO_ENDPOINT: "http://localhost",
  LOGTO_APP_ID: "synthetics",
  LOGTO_APP_SECRET: "synthetics",
  JWT_PRIVATE_KEY: Buffer.from(keys.privateKey).toString("base64"),
  JWT_PUBLIC_KEY: Buffer.from(keys.publicKey).toString("base64"),
  SQIDS_ALPHABET:
    "P1fF29hw8BARdJpoSUZIDnXVWNzcCeGrlgk0qbsMxjYKaE5uLTyOt376Hmv4Qi",
  CHRONO_SECRET: "synthetics",
};

const sql = async (query: string, as = db) => {
  const client = new pg.Client(as);
  await client.connect();
  try {
    return await client.query(query);
  } finally {
    await client.end();
  }
};

// runs a backend script, in its own process group so killing it takes tsx's
// node child down too
const backendScript = (script: string, args: string[] = []) =>
  spawn("pnpm", ["exec", "tsx", script, ...args], {
    cwd: backendDir,
    env: backendEnv,
    stdio: ["ignore", "pipe", "inherit"],
    detached: true,
  });

// seed.ts prints the seeded ids as json on its last line
const seed = async () => {
  const child = backendScript("src/seed.ts", ["starter-pack"]);
  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  const code = await new Promise((done) => child.on("exit", done));
  if (code !== 0) throw new Error(`seed failed:\n${output}`);
  const seeded: { timetables: Record<string, string> } = JSON.parse(
    output.trim().split("\n").at(-1) ?? "",
  );
  return seeded.timetables;
};

const waitForBackend = async (backend: ChildProcess) => {
  for (let i = 0; i < 120; i++) {
    if (backend.exitCode !== null) throw new Error("backend exited");
    try {
      await fetch(`${API}/auth/check`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error("backend never came up");
};

// like networkidle, but with a much shorter quiet window than playwright's
// fixed 500ms, and the dom has to stop changing too: requests can all be done
// while react is still rendering their results
const QUIET_MS = 100;
const trackRequests = async (page: Page) => {
  await page.addInitScript(() => {
    const w = window as unknown as { lastMutation: number };
    w.lastMutation = performance.now();
    new MutationObserver(() => {
      w.lastMutation = performance.now();
    }).observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });
  });
  let inflight = 0;
  let last = performance.now();
  const done = () => {
    inflight--;
    last = performance.now();
  };
  page.on("request", () => {
    inflight++;
  });
  page.on("requestfinished", done);
  page.on("requestfailed", done);
  return async () => {
    for (;;) {
      if (inflight === 0 && performance.now() - last >= QUIET_MS) {
        const domQuiet = await page.evaluate(
          () =>
            performance.now() -
            (window as unknown as { lastMutation: number }).lastMutation,
        );
        if (domQuiet >= QUIET_MS && inflight === 0) return;
      }
      await new Promise((r) => setTimeout(r, 20));
    }
  };
};

const shoot = async (
  timetables: Record<string, string>,
  announcementIds: string[],
) => {
  const users = Object.fromEntries(scenario.users.map((u) => [u.key, u]));
  // pin some args for determinism in rendering
  const browser = await chromium.launch({
    args: [
      "--disable-gpu",
      "--disable-partial-raster",
      "--disable-skia-runtime-opts",
      "--force-color-profile=srgb",
      "--font-render-hinting=none",
    ],
  });
  rmSync(outDir, { recursive: true, force: true });

  const variants = Object.entries(DEVICES).flatMap(([device, options]) =>
    THEMES.map((theme) => ({ device, options, theme })),
  );
  const jobs = synthetics.flatMap((synthetic) => {
    const url = synthetic.url.replace(/\{([\w-]+)\}/g, (_, key) => {
      if (!timetables[key]) {
        throw new Error(`${synthetic.name}: no timetable ${key}`);
      }
      return timetables[key];
    });
    // `as` is a scenario user, or the email of someone who hasn't signed up
    const user =
      synthetic.as &&
      (users[synthetic.as] ?? { email: synthetic.as, name: "New Student" });
    return variants.map((variant) => ({ synthetic, url, user, ...variant }));
  });
  // SHARD=i/n shoots every nth screenshot starting at the ith, so ci can split
  // the run across machines
  const [shard, shards] = (process.env.SHARD ?? "1/1").split("/").map(Number);
  const mine = jobs.filter((_, i) => i % shards === shard - 1);

  const run = async ({
    synthetic,
    url,
    user,
    device,
    options,
    theme,
  }: (typeof jobs)[number]) => {
    const context = await browser.newContext({
      ...options,
      deviceScaleFactor: 1,
      baseURL: FRONTEND_URL,
      colorScheme: theme,
      locale: "en-IN",
      timezoneId: "Asia/Kolkata",
      reducedMotion: "reduce",
    });
    await context.clock.setFixedTime(NOW);
    // seeded Math.random
    await context.addInitScript(() => {
      let seed = 1;
      Math.random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
    });
    if (!synthetic.unreadAnnouncements) {
      await context.addInitScript((read) => {
        localStorage.setItem("readAnnouncements", read);
      }, JSON.stringify(announcementIds));
    }
    const page = await context.newPage();
    const settle = await trackRequests(page);
    if (user) {
      await context.request.get(
        `/api/auth/as?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name)}`,
        { maxRedirects: 0 },
      );
    }
    await page.goto(url);
    await settle();
    if (synthetic.act) {
      await synthetic.act(page);
      await settle();
    }
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: resolve(outDir, synthetic.name, `${device}-${theme}.png`),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await context.close();
    console.log(`shot ${synthetic.name}/${device}-${theme}`);
  };

  // one shared queue instead of a synthetic at a time, so nothing waits on the
  // slowest variant of each synthetic. the run is cpu bound, so more pages
  // than cores only slows it down
  const concurrency = availableParallelism();
  let next = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < mine.length) await run(mine[next++]);
    }),
  );
  await browser.close();
};

const main = async () => {
  // the frontend doesn't need the database, so it builds while that's set up
  process.env.VITE_FRONTEND_URL = FRONTEND_URL;
  const built = build({ root: frontendDir, logLevel: "warn" });

  await sql(`DROP DATABASE IF EXISTS ${DB_NAME} WITH (FORCE)`, admin);
  await sql(`DROP ROLE IF EXISTS ${DB_NAME}`, admin);
  await sql(`CREATE ROLE ${DB_NAME} LOGIN PASSWORD '${DB_NAME}'`, admin);
  await sql(`CREATE DATABASE ${DB_NAME} OWNER ${DB_NAME}`, admin);

  const timetables = await seed();
  const { rows } = await sql("SELECT id FROM announcement");

  const backend = backendScript("src/index.ts");
  backend.stdout.pipe(process.stdout);
  try {
    await waitForBackend(backend);

    await built;
    const server = await preview({
      root: frontendDir,
      preview: {
        port: FRONTEND_PORT,
        strictPort: true,
        proxy: {
          "/api": {
            target: API,
            rewrite: (path) => path.replace(/^\/api/, ""),
          },
        },
      },
    });
    try {
      await shoot(
        timetables,
        rows.map((r) => r.id),
      );
    } finally {
      await server.close();
    }
  } finally {
    if (backend.pid) process.kill(-backend.pid);
  }
};

await main();
