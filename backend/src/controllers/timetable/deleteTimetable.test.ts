import supertest, { Response } from "supertest";
import { degreeEnum } from "../../../../lib/src/index.js";
import app from "../../app.js";
import { AppDataSource } from "../../db.js";
import { Timetable, User } from "../../entity/entities.js";
import { timetableRepository } from "../../repositories/timetableRepository.js";
import { userRepository } from "../../repositories/userRepository.js";

const request = supertest(app);

beforeAll(async () => {
  await AppDataSource.initialize();
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe("Test deleteTimetable", () => {
  const testUsers = [
    {
      batch: 2021,
      name: "UVW XYZ",
      degrees: ["A7"] as degreeEnum[],
      email: "f20210000@hyderabad.bits-pilani.ac.in",
    },
    {
      batch: 2022,
      name: "ABC DEF",
      degrees: ["B3", "A7"] as degreeEnum[],
      email: "f20220000@hyderabad.bits-pilani.ac.in",
    },
  ];

  describe("Create test data", () => {
    let uuids: string[] = [];

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

    it("Create test timetables", async () => {
      for (let i = 0; i < testUsers.length; i++) {
        await timetableRepository
          .createQueryBuilder()
          .insert()
          .into(Timetable)
          .values({
            name: "Test Timetable",
            authorId: uuids[i],
            degrees: testUsers[i].degrees,
            private: true,
            draft: true,
            archived: false,
            acadYear: 2022,
            semester: 2,
            year: 2022 - testUsers[i].batch + 1,
            sections: [],
            timings: [],
            examTimes: [],
            warnings: [],
            createdAt: new Date(),
            lastUpdated: new Date(),
          })
          .execute();
      }
    });
  });

  describe("Test deleteTimetable 400 (invalid timetable ID)", () => {
    let response: Response | null = null;

    it("Make API call expecting 400", async () => {
      response = await request.post("/timetable/abcd/delete").send({
        email: testUsers[0].email,
      });
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

    test("Test if error issues code is correct", () => {
      expect(response?.body.issues[0].code).toEqual("invalid_type");
    });

    test("Test if error issues message is correct", () => {
      expect(response?.body.issues[0].message).toEqual(
        "timetable id not a number",
      );
    });

    test("Test if error issues path is correct", () => {
      expect(response?.body.issues[0].path).toStrictEqual(["params", "id"]);
    });
  });

  describe("Test deleteTimetable 400 (missing user email)", () => {
    let response: Response | null = null;

    it("Make API call expecting 400", async () => {
      response = await request.post("/timetable/1/delete");
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

    test("Test if error issues code is correct", () => {
      expect(response?.body.issues[0].code).toEqual("invalid_type");
    });

    test("Test if error issues message is correct", () => {
      expect(response?.body.issues[0].message).toEqual(
        "user email is required",
      );
    });

    test("Test if error issues path is correct", () => {
      expect(response?.body.issues[0].path).toStrictEqual(["body", "email"]);
    });
  });

  describe("Test deleteTimetable 400 (invalid user email)", () => {
    let response: Response | null = null;

    it("Make API call expecting 400", async () => {
      response = await request.post("/timetable/1/delete").send({
        email: "insertrandomstringhere",
      });
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
      expect(response?.body.issues[0].validation).toEqual("regex");
    });

    test("Test if error issues code is correct", () => {
      expect(response?.body.issues[0].code).toEqual("invalid_string");
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

  describe("Test deleteTimetable 401 (unregistered user)", () => {
    let response: Response | null = null;

    it("Make API call expecting 401", async () => {
      response = await request.post("/timetable/1/delete").send({
        email: "f20230000@hyderabad.bits-pilani.ac.in",
      });
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns response status 401", () => {
      expect(response?.status).toEqual(401);
    });

    test("Test if response error is correct", () => {
      expect(response?.body.message).toEqual("unregistered user");
    });
  });

  describe("Test deleteTimetable 404 (timetable not found)", () => {
    let response: Response | null = null;

    it("Make API call expecting 404", async () => {
      response = await request.post("/timetable/12345678/delete").send({
        email: testUsers[0].email,
      });
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns response status 404", () => {
      expect(response?.status).toEqual(404);
    });

    test("Test if response error is correct", () => {
      expect(response?.body.message).toEqual("timetable not found");
    });
  });

  describe("Test deleteTimetable 403 (unauthorised user)", () => {
    let response: Response | null = null;

    it("Make API call expecting 403", async () => {
      response = await request.post("/timetable/2/delete").send({
        email: testUsers[0].email,
      });
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns response status 403", () => {
      expect(response?.status).toEqual(403);
    });

    test("Test if response error is correct", () => {
      expect(response?.body.message).toEqual("user does not own timetable");
    });
  });

  describe("Test deleteTimetable 200", () => {
    let response: Response | null = null;

    it("Make API call expecting 200", async () => {
      response = await request.post("/timetable/1/delete").send({
        email: testUsers[0].email,
      });
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns response status 200", () => {
      expect(response?.status).toEqual(200);
    });

    test("Test if response message is correct", () => {
      expect(response?.body.message).toEqual("timetable deleted");
    });

    test("Test if timetable has been deleted", async () => {
      const timetable = await timetableRepository
        .createQueryBuilder("timetable")
        .where("timetable.id = :id", { id: "1" })
        .getOne();
      expect(timetable).toBeNull();
    });
  });
});
