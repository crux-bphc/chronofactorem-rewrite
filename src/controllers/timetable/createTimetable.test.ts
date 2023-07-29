import { z } from "zod";
import app from "../../app";
import { AppDataSource } from "../../db";
import { User } from "../../entity/User";
import { userRepository } from "../../repositories/userRepository";
import supertest, { Response } from "supertest";
import { Timetable } from "../../entity/Timetable";
import { timetableRepository } from "../../repositories/timetableRepository";

const request = supertest(app);

beforeAll(async () => {
  await AppDataSource.initialize();
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe("Test createTimetable", () => {
  let response: Response | null = null;
  it("Add test users", async () => {
    // single degree student
    userRepository
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({
        batch: 2021,
        name: "UVW XYZ",
        degrees: ["A7"],
        email: "f20210000@hyderabad.bits-pilani.ac.in",
        timetables: [],
      })
      .execute();

    // dual degree student
    userRepository
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({
        batch: 2022,
        name: "ABC DEF",
        degrees: ["B3", "A7"],
        email: "f2022000@hyderbad.bits-pilani.ac.in",
        timetables: [],
      })
      .execute();
  });

  describe("Test createTimetable with invalid email", () => {
    it("Make API call", async () => {
      response = await request.post("/timetable/create").send({
        email: "errorEmail",
      });
    });

    test("Test if returns response status 400", () => {
      expect(response?.status).toEqual(400);
    });

    test("Test if returns error message", () => {
      expect(response?.body).toHaveProperty("issues");
      expect(response?.body.issues[0]).toHaveProperty("message");
    });
  });

  describe("Test createTimetable with unregistered email", () => {
    it("Make API call", async () => {
      response = await request.post("/timetable/create").send({
        email: "f20219999@hyderabad.bits-pilani.ac.in",
      });
    });

    test("Test if returns response status 401", () => {
      expect(response?.status).toEqual(401);
    });

    test("Test if returns error message", () => {
      expect(response?.body).toHaveProperty("message");
    });
  });

  describe("Test createTimetable as single degree student", () => {
    it("Make API call", async () => {
      response = await request.post("/timetable/create").send({
        email: "f20210000@hyderabad.bits-pilani.ac.in",
      });
    });

    test("Test if returns status 201", () => {
      expect(response?.status).toEqual(201);
    });
  });

  describe("Test createTimetable as dual degree student", () => {
    it("Make API call", async () => {
      response = await request.post("/timetable/create").send({
        email: "f2022000@hyderbad.bits-pilani.ac.in",
      });
    });

    test("Test if returns status 201", () => {
      expect(response?.status).toEqual(201);
    });
  });
});
