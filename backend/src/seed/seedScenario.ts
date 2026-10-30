import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { readdirSync, readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { resolve } from "node:path";
import { degreeZodList, getBatchFromEmail, unknownDegree } from "lib";
import { z } from "zod";
import app from "../app.js";
import { env } from "../config/server.js";
import { AppDataSource } from "../db.js";
import {
  Announcement,
  Course,
  Section,
  Timetable,
  User,
} from "../entity/entities.js";
import { ingestJSON } from "../ingestJSON.js";
import timetableJSON from "../timetable.json" with { type: "json" };
import { hashFingerprint, signJWT } from "../utils/authUtils.js";
import sqids from "../utils/sqids.js";

// a seed scenario is a json file in ./scenarios describing a full db state:
// users, their timetables, announcements, and optionally a frozen course
// catalogue (otherwise timetable.json is used)
const ZodScenario = z.object({
  name: z.string(),
  description: z.string(),
  seededAt: z.iso.datetime({ offset: true }).optional(),
  users: z.array(
    z.object({
      key: z.string(),
      email: z.email(),
      name: z.string(),
      // no degree set by default = non-undergrad user
      degrees: degreeZodList.optional(),
      timetables: z
        .array(
          z.object({
            key: z.string(),
            name: z.string().default("Untitled Timetable"),
            private: z.boolean().default(true),
            draft: z.boolean().default(true),
            archived: z.boolean().default(false),
            // course code -> section names, e.g. "CS F211": ["L1", "T2"]
            sections: z.record(z.string(), z.array(z.string())).default({}),
          }),
        )
        .default([]),
    }),
  ),
  announcements: z
    .array(z.object({ title: z.string(), message: z.string() }))
    .default([]),
  // same shape as the courses in timetable.json
  courses: z.record(z.string(), z.unknown()).optional(),
});
export type Scenario = z.infer<typeof ZodScenario>;

const scenariosDir = resolve(import.meta.dirname, "scenarios");

export const listScenarios = () =>
  readdirSync(scenariosDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/, ""));

export const loadScenario = (name: string) =>
  ZodScenario.parse(
    JSON.parse(readFileSync(resolve(scenariosDir, `${name}.json`), "utf8")),
  );

export const seedScenario = async (scenario: Scenario) => {
  if (env.NODE_ENV !== "development") {
    throw new Error("scenarios can only be seeded in development");
  }
  const manager = AppDataSource.manager;
  if ((await manager.count(User)) > 0 || (await manager.count(Course)) > 0) {
    throw new Error("scenarios can only be seeded into an empty database");
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await ingestJSON(
    (scenario.courses
      ? { metadata: timetableJSON.metadata, courses: scenario.courses }
      : timetableJSON) as Parameters<typeof ingestJSON>[0],
    queryRunner,
  );
  await queryRunner.release();

  const sectionIds = new Map<string, string>();
  for (const section of await manager.find(Section, {
    relations: { course: true },
  })) {
    sectionIds.set(
      `${section.course.code} ${section.type}${section.number}`,
      section.id,
    );
  }

  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;
  const post = async <T>(cookie: string, path: string, body: object) => {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
    return (await res.json()) as T;
  };

  const users: Record<string, string> = {};
  const timetables: Record<string, string> = {};
  try {
    for (const user of scenario.users) {
      const batch = getBatchFromEmail(user.email);
      if (batch !== "0000" && !user.degrees) {
        throw new Error(`${user.key} needs degrees`);
      }
      const { identifiers } = await manager.insert(User, {
        email: user.email,
        name: user.name,
        batch: Number.parseInt(batch, 10),
        degrees: batch === "0000" ? [unknownDegree] : user.degrees,
      });
      const id: string = identifiers[0].id;
      users[user.key] = id;

      const fingerprint = randomBytes(16).toString("hex");
      const session = signJWT(
        {
          id,
          name: user.name,
          email: user.email,
          fingerprintHash: hashFingerprint(fingerprint),
        },
        60_000,
      );
      const cookie = `session=${session}; fingerprint=${fingerprint}`;

      for (const timetable of user.timetables) {
        const { id } = await post<{ id: string }>(
          cookie,
          "/timetable/create",
          {},
        );
        timetables[timetable.key] = id;
        for (const [code, names] of Object.entries(timetable.sections)) {
          for (const name of names) {
            const sectionId = sectionIds.get(`${code} ${name}`);
            if (!sectionId) throw new Error(`no section ${code} ${name}`);
            await post(cookie, `/timetable/${id}/add`, { sectionId });
          }
        }
        await post(cookie, `/timetable/${id}/edit`, {
          name: timetable.name,
          isPrivate: timetable.private,
          isDraft: timetable.draft,
        });
        if (timetable.archived) {
          await manager.update(Timetable, sqids.decode(id)[0], {
            archived: true,
          });
        }
      }
    }
  } finally {
    server.close();
  }

  // listed newest first, a day apart
  const at = scenario.seededAt ? new Date(scenario.seededAt) : new Date();
  const day = 24 * 60 * 60 * 1000;
  await manager.insert(
    Announcement,
    scenario.announcements.map((announcement, i) => ({
      ...announcement,
      createdAt: new Date(at.getTime() - i * day),
    })),
  );

  if (scenario.seededAt) {
    for (const entity of [User, Course, Section]) {
      await manager
        .createQueryBuilder()
        .update(entity)
        .set({ createdAt: at })
        .execute();
    }
    await manager
      .createQueryBuilder()
      .update(Timetable)
      .set({ createdAt: at, lastUpdated: at })
      .execute();
  }

  return { users, timetables };
};
