import supertest, { Response } from "supertest";
import { AppDataSource } from "../../db";
import app from "../../app";
import { timetableRepository } from "../../repositories/timetableRepository";
import { Timetable } from "../../entity/Timetable";
import { userRepository } from "../../repositories/userRepository";
import { User } from "../../entity/User";
import { degreeEnum } from "../../types/degrees";
const request = supertest(app);

beforeAll(async () => {
  await AppDataSource.initialize();
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe("Test editTimetableMetadata", () => {
  const mockUserData = [
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

  let userData: User[] = [];

  describe("Create test data", () => {
    let uuids: string[] = [];

    it("Create test users", async () => {
      await userRepository
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(
          mockUserData.map((testUser) => ({
            ...testUser,
            timetables: [],
          }))
        )
        .execute();
    });

    it("Store test user uuids", async () => {
      const users = await userRepository
        .createQueryBuilder("user")
        .orderBy("user.batch")
        .getMany();
      uuids = users.map((user) => user.id);
    });

    it("Create test timetables", async () => {
      for (let i = 0; i < mockUserData.length; i++) {
        await timetableRepository
          .createQueryBuilder()
          .insert()
          .into(Timetable)
          .values([
            {
              name: "Draft Timetable",
              authorId: uuids[i],
              degrees: mockUserData[i].degrees,
              private: false,
              draft: true,
              archived: false,
              acadYear: 2022,
              semester: 2,
              year: 2022 - mockUserData[i].batch + 1,
              sections: [],
              timings: [],
              examTimes: [],
              warnings: [],
              createdAt: new Date(),
              lastUpdated: new Date(),
            },
            {
              name: "Final Timetable",
              authorId: uuids[i],
              degrees: mockUserData[i].degrees,
              private: true,
              draft: false,
              archived: false,
              acadYear: 2022,
              semester: 2,
              year: 2022 - mockUserData[i].batch + 1,
              sections: [],
              timings: [],
              examTimes: [],
              warnings: [],
              createdAt: new Date(),
              lastUpdated: new Date(),
            },
          ])
          .execute();
      }
    });

    it("Store test timetables", async () => {
      userData = await userRepository
        .createQueryBuilder("user")
        .orderBy("user.batch")
        .leftJoin("user.timetables", "timetable")
        .select(["user", "timetable"])
        .getMany();
    });
  });

  describe("Test editTimetableMetadata 404", () => {
    let response: Response | null = null;

    test("Make API call", async () => {
      response = await request.post("/timetable/69420/edit").send({
        email: "f20220000@hyderabad.bits-pilani.ac.in",
        name: "ABC DEF",
        isPrivate: true,
        isDraft: true,
      });
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns 404", () => {
      expect(response?.status).toEqual(404);
    });

    test("Test if response error is correct", () => {
      expect(response?.body.message).toEqual("timetable not found");
    });
  });

  describe("Test editTimetableMetadata 401", () => {
    let response: Response | null = null;

    test("Make API call", async () => {
      const timetable = userData[0].timetables[0];

      response = await request.post(`/timetable/${timetable.id}/edit`).send({
        email: "f20690000@hyderabad.bits-pilani.ac.in",
        name: "ABC DEF",
        isPrivate: true,
        isDraft: true,
      });
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns 401", () => {
      expect(response?.status).toEqual(401);
    });

    test("Test if response error is correct", () => {
      expect(response?.body.message).toEqual("unregistered user");
    });
  });

  describe("Test editTimetableMetadata 403", () => {
    let response: Response | null = null;

    test("Make API call", async () => {
      const timetable = userData[0].timetables[0];

      response = await request.post(`/timetable/${timetable.id}/edit`).send({
        email: userData[1].email,
        name: userData[1].name,
        isPrivate: !timetable.private,
        isDraft: !timetable.draft,
      });
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns 403", () => {
      expect(response?.status).toEqual(403);
    });

    test("Test if response error is correct", () => {
      expect(response?.body.message).toEqual("user does not own timetable");
    });
  });

  describe("Test editTimetableMetadata 200", () => {
    let response: Response | null = null;

    test("Make API call", async () => {
      const timetable = userData[0].timetables[0];

      response = await request.post(`/timetable/${timetable.id}/edit`).send({
        email: userData[0].email,
        name: userData[0].name,
        isPrivate: !timetable.private,
        isDraft: !timetable.draft,
      });
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns 200", () => {
      expect(response?.status).toEqual(200);
    });

    test("Test if response error is correct", () => {
      expect(response?.body.message).toEqual("timetable edited");
    });

    test("Test if values have been changed", async () => {
      const updatedUsers = await userRepository
        .createQueryBuilder("user")
        .orderBy("user.batch")
        .leftJoin("user.timetables", "timetable")
        .select(["user", "timetable"])
        .getMany();
      expect(updatedUsers[0].timetables[0].private).toEqual(!userData[0].timetables[0].private);
      expect(updatedUsers[0].timetables[0].draft).toEqual(!userData[0].timetables[0].draft);
    });
  });
});
