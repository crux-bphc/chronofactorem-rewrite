import assert from "node:assert/strict";
import { test } from "node:test";
import type { TimetableSectionType } from "../src/utils/timetable";
import { buildTimetableGrid } from "../src/utils/timetableGrid";

const section = (roomTime: string[]): TimetableSectionType => ({
  id: "section",
  name: "Course",
  courseId: "CS F101",
  type: "P",
  number: 1,
  instructors: [],
  roomTime,
});

test("consecutive hours merge without moving subsequent classes", () => {
  const result = buildTimetableGrid([
    section(["CS F101:R1:M:2", "CS F101:R1:M:3", "CS F101:R1:T:1"]),
  ]);
  assert.deepEqual(
    result.cells.map(({ day, hour, span }) => ({ day, hour, span })),
    [
      { day: 0, hour: 1, span: 2 },
      { day: 1, hour: 0, span: 1 },
    ],
  );
});

test("merging stops at a room change, section change, or day boundary", () => {
  const result = buildTimetableGrid([
    section(["CS F101:R1:M:12", "CS F101:R2:M:13", "CS F101:R2:T:1"]),
    { ...section(["CS F101:R2:T:2"]), id: "other-section" },
  ]);
  assert.equal(result.cells.length, 4);
  assert.ok(result.cells.every((cell) => cell.span === 1));
});

test("Saturday and late classes expand the grid; malformed slots do not", () => {
  const source = section([
    "CS F101:R1:S:13",
    "bad",
    "CS F101:R1:Sun:1",
    "CS F101:R1:M:99",
  ]);
  const before = structuredClone(source);
  const result = buildTimetableGrid([source]);
  assert.equal(result.dayCount, 6);
  assert.equal(result.hourCount, 13);
  assert.equal(result.cells.length, 1);
  assert.deepEqual(source, before);
});
