import { AppDataSource } from "./db";
import { courseRepository } from "./repositories/courseRepository";
import timetableTestJSON from "./tests/timetable.test.json";

beforeAll(async () => {
  await AppDataSource.initialize();
});

afterAll(async () => {
  await AppDataSource.destroy();
});

test("Test if all courses have been ingested", async () => {
  const courses = await courseRepository.createQueryBuilder("course").getMany();
  const courseJSONCount = Object.keys(timetableTestJSON.courses).length;
  expect(courses.length).toBe(courseJSONCount);
});
