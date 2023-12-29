import supertest, { Response } from "supertest";
import app from "../../app";
import { AppDataSource } from "../../db";
import { Timetable } from "../../entity/Timetable";
import { User } from "../../entity/User";
import { timetableRepository } from "../../repositories/timetableRepository";
import { userRepository } from "../../repositories/userRepository";
import { degreeEnum } from "../../types/degrees";

const request = supertest(app);

beforeAll(async () => {
  await AppDataSource.initialize();
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe("Test createTimetable", () => {
  const testUsers = [
    {
      batch: 2021,
      name: "UVW XYZ",
      degrees: ["A7"] as degreeEnum[],
      email: "f202100000@hyderabad.bits-pilani.ac.in",
    },
    {
      batch: 2022,
      name: "ABC DEF",
      degrees: ["B3", "A7"] as degreeEnum[],
      email: "f202200000@hyderabad.bits-pilani.ac.in",
    },
  ];
  let uuids: string[] = [];

  describe("Create test data", () => {
    it("Create test users", async () => {
      for (const testUser of testUsers) {
        await userRepository
          .createQueryBuilder()
          .insert()
          .into(User)
          .values({
            ...testUser,
            timetables: [],
          })
          .execute();
      }
    });
    it("Store test user uuids", async () => {
      const users = await userRepository
        .createQueryBuilder("user")
        .orderBy("user.batch")
        .getMany();
      uuids = users.map((user) => user.id);
    });
  });

  describe("Test createTimetable 400 (invalid user email)", () => {
    let response: Response | null = null;
    it("Make API call expecting 400", async () => {
      response = await request.post("/timetable/create").send({
        email: "errorEmail",
      });
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns response status 400", () => {
      expect(response?.status).toEqual(400);
    });

    test("Test if error name is correct", () => {
      expect(response?.body.name).toEqual("ZodError");
    });

    test("Test if error issues are present", () => {
      expect(response?.body).toHaveProperty("issues");
    });

    test("Test if error issues validation is correct", () => {
      expect(response?.body.issues[0].validation).toEqual("regex");
    });

    test("Test if error issues code is correct", () => {
      expect(response?.body.issues[0].code).toEqual("invalid_string");
    });

    test("Test if error issues has a message", () => {
      expect(response?.body.issues[0]).toHaveProperty("message");
    });

    test("Test if error issues message is correct", () => {
      expect(response?.body.issues[0].message).toEqual(
        "user email must be a valid email",
      );
    });

    test("Test if error issues path is correct", () => {
      expect(response?.body.issues[0].path).toStrictEqual(["body", "email"]);
    });
  });

  describe("Test createTimetable 401 (unregistered user)", () => {
    let response: Response | null = null;
    it("Make API call expecting 401", async () => {
      response = await request.post("/timetable/create").send({
        email: "f20219999@hyderabad.bits-pilani.ac.in",
      });
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns response status 401", () => {
      expect(response?.status).toEqual(401);
    });

    test("Test if error issues has a message", () => {
      expect(response?.body).toHaveProperty("message");
    });

    test("Test if response error is correct", () => {
      expect(response?.body.message).toEqual("unregistered user");
    });
  });

  describe("Test createTimetable 201 (as single degree student)", () => {
    let response: Response | null = null;
    let timetable: Timetable | null = null;
    it("Make API call", async () => {
      response = await request.post("/timetable/create").send({
        email: "f202100000@hyderabad.bits-pilani.ac.in",
      });
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns status 201", () => {
      expect(response?.status).toEqual(201);
    });

    test("Test if response message is correct", () => {
      expect(response?.body.message).toEqual("Timetable created successfully");
    });

    test("Test if timetable is created", async () => {
      timetable = await timetableRepository
        .createQueryBuilder("timetable")
        .where("timetable.authorId = :id", { id: uuids[0] })
        .getOne();
      expect(timetable).toBeTruthy();
    });
  });

  describe("Test createTimetable 201 (as dual degree student)", () => {
    let response: Response | null = null;
    let timetable: Timetable | null = null;
    it("Make API call", async () => {
      response = await request.post("/timetable/create").send({
        email: "f202200000@hyderabad.bits-pilani.ac.in",
      });
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns status 201", () => {
      expect(response?.status).toEqual(201);
    });

    test("Test if response message is correct", () => {
      expect(response?.body.message).toEqual("Timetable created successfully");
    });

    test("Test if timetable is created", async () => {
      timetable = await timetableRepository
        .createQueryBuilder("timetable")
        .where("timetable.authorId = :id", { id: uuids[1] })
        .getOne();
      expect(timetable).toBeTruthy();
    });
  });
});
