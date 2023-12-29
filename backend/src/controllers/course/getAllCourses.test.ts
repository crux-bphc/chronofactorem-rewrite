import supertest, { Response } from "supertest";
import { courseType } from "../../../../lib";
import app from "../../app";
import { AppDataSource } from "../../db";
import { Course } from "../../entity/Course";
import { courseRepository } from "../../repositories/courseRepository";
import timetableTestJSON from "../../tests/timetable.test.json";

const request = supertest(app);

beforeAll(async () => {
  await AppDataSource.initialize();
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe("Test getAllCourses", () => {
  let allCourses: Map<string, Course> | null = null;

  it("get all courses from db", async () => {
    allCourses = new Map(
      (await courseRepository.createQueryBuilder().getMany()).map((course) => [
        course.id,
        course,
      ]),
    );
  });

  test("Test if database contains non-zero courses", () => {
    expect(allCourses?.size).toBeGreaterThan(0);
  });

  test("Test if database contains all courses from JSON", () => {
    expect(allCourses?.size).toBe(
      Object.keys(timetableTestJSON.courses).length,
    );
  });

  describe("Test getAllCourses 200", () => {
    let response: Response | null = null;

    it("Make API call", async () => {
      response = await request.get("/course/");
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).not.toHaveLength(0);
    });

    test("Test if returns response status 200", () => {
      expect(response?.status).toEqual(200);
    });

    test("Test if all courses are valid", () => {
      expect(() =>
        courseType
          .array()
          .min(1, { message: "courses missing" })
          .parse(response?.body),
      ).not.toThrow();
    });
  });
});
