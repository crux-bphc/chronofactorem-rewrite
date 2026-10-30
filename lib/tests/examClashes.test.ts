import assert from "node:assert/strict";
import { test } from "node:test";
import { getClashingExamTimes } from "../src/examClashes.js";

const course = {
  code: "CS F101",
  midsemStartTime: "2026-10-01T09:00:00Z",
  midsemEndTime: "2026-10-01T11:00:00Z",
  compreStartTime: null,
  compreEndTime: null,
};
const exam = (start: string, end: string, code = "MATH F101") =>
  `${code}|MIDSEM|2026-10-01T${start}:00Z|2026-10-01T${end}:00Z`;

test("detects partial overlaps and contained exams with different timestamps", () => {
  for (const interval of [
    ["08:00", "10:00"],
    ["10:00", "12:00"],
    ["09:30", "10:30"],
    ["08:00", "12:00"],
  ]) {
    assert.equal(
      getClashingExamTimes(course, [exam(interval[0], interval[1])])?.length,
      1,
    );
  }
});
test("adjacent exams and the selected course's own exams do not clash", () => {
  assert.equal(
    getClashingExamTimes(course, [
      exam("07:00", "09:00"),
      exam("11:00", "13:00"),
      exam("09:00", "11:00", course.code),
    ]),
    null,
  );
});
test("Date values, compres, and missing exam dates are handled consistently", () => {
  assert.equal(
    getClashingExamTimes(
      {
        ...course,
        midsemStartTime: null,
        midsemEndTime: null,
        compreStartTime: new Date(course.midsemStartTime),
        compreEndTime: new Date(course.midsemEndTime),
      },
      [exam("10:00", "12:00")],
    )?.length,
    1,
  );
  assert.equal(
    getClashingExamTimes(
      { ...course, midsemStartTime: null, midsemEndTime: null },
      [exam("09:00", "11:00")],
    ),
    null,
  );
});
