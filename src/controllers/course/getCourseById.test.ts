import app from "../../app";
import { AppDataSource } from "../../db";
import { Course, courseType } from "../../entity/Course";
import { courseRepository } from "../../repositories/courseRepository";
import timetableTestJSON from "../../tests/timetable.test.json";
import supertest, { Response } from "supertest";
import { randomUUID } from "crypto";
import { sectionType } from "../../entity/Section";

const request = supertest(app);

beforeAll(async () => {
  await AppDataSource.initialize();
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe("Test getCourseById", () => {
  const allCourses = Object.keys(timetableTestJSON.courses);
  let randomCourse: Course | null = null;

  it("get randomCourse from db", async () => {
    randomCourse = await courseRepository
      .createQueryBuilder("course")
      .where("course.code = :code", {
        code: allCourses[Math.floor(Math.random() * allCourses.length)],
      })
      .getOne();
  });

  test("Test if database contains random course", () => {
    expect(randomCourse).toBeTruthy();
  });

  describe("Test getCourseById 200", () => {
    describe("Test response", () => {
      let response: Response | null = null;

      it("Make API call", async () => {
        response = await request.get(`/course/${randomCourse?.id}`);
      });

      test("Test if returns truthy response", () => {
        expect(response?.body).toBeTruthy();
      });

      test("Test if returns response status 200", () => {
        expect(response?.status).toEqual(200);
      });

      test("Test if course is valid", () => {
        expect(() => courseType.parse(response?.body)).not.toThrow();
      });

      test("Test if course sections are valid", () => {
        expect(() =>
          sectionType.array().min(0).parse(response?.body.sections)
        ).not.toThrow();
      });
    });
  });

  describe("Test getCourseById 400", () => {
    let response: Response | null = null;

    it("Make API call expecting 400", async () => {
      response = await request.get(`/course/400`);
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns response status 400", () => {
      expect(response?.status).toEqual(400);
    });

    test("Test if error issues are present", () => {
      expect(response?.body.issues).toHaveLength(1);
    });

    test("Test if error name is correct", () => {
      expect(response?.body.name).toEqual("ZodError");
    });

    test("Test if error issues validation is correct", () => {
      expect(response?.body.issues[0].validation).toEqual("uuid");
    });

    test("Test if error issues code is correct", () => {
      expect(response?.body.issues[0].code).toEqual("invalid_string");
    });

    test("Test if error issues message is correct", () => {
      expect(response?.body.issues[0].message).toEqual(
        "course id must be a valid uuid"
      );
    });

    test("Test if error issues path is correct", () => {
      expect(response?.body.issues[0].path).toStrictEqual(["params", "id"]);
    });
  });

  describe("Test getCourseById 404", () => {
    let response: Response | null = null;

    it("Make API call expecting 404", async () => {
      let nonExistentUUID = "7a8ba966-001a-4492-bc20-f1fe263e68de";
      while (nonExistentUUID === randomCourse?.id) {
        nonExistentUUID = randomUUID();
      }
      response = await request.get(`/course/${nonExistentUUID}`);
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns response status 404", () => {
      expect(response?.status).toEqual(404);
    });

    test("Test if response error is correct", () => {
      expect(response?.body.message).toEqual("Course does not exist");
    });
  });
});
