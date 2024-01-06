import supertest, { Response } from "supertest";
import { AppDataSource } from "../../db";
import app from "../../app";
import { timetableRepository } from "../../repositories/timetableRepository";
import { Timetable } from "../../entity/Timetable";
import { userRepository } from "../../repositories/userRepository";
import { courseRepository } from "../../repositories/courseRepository";
import { User } from "../../entity/User";
import { degreeEnum } from "../../types/degrees";
import { sectionRepository } from "../../repositories/sectionRepository";
import { Section } from "../../entity/Section";

const request = supertest(app);

let testSection: Section;

beforeAll(async () => {
  await AppDataSource.initialize();
  const createSection = async () => {
    const sections = await sectionRepository
      .createQueryBuilder("section")
      .getMany();
    const section = sections[0];
    return section;
  };

  const testCourse = async () => {
    const courses = await courseRepository
      .createQueryBuilder("courses")
      .getMany();
    console.log(courses[0]);
  };

  testSection = await createSection();
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe("Test removeSection", () => {
  const mockUsers = [
    // single degree student
    {
      batch: 2021,
      name: "UVW XYZ",
      degrees: ["A7"] as degreeEnum[],
      email: "f20210002@hyderabad.bits-pilani.ac.in",
    },
    //dual degree student
    {
      batch: 2022,
      name: "ABC DEF",
      degrees: ["B3", "A7"] as degreeEnum[],
      email: "f20220003@hyderabad.bits-pilani.ac.in",
    },
  ];

  describe("Create test data", () => {
    let uuids: string[] = [];

    it("Create test users", async () => {
      for (const user of mockUsers) {
        await userRepository
          .createQueryBuilder()
          .insert()
          .into(User)
          .values({ ...user, timetables: [] })
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
      const examTimes = [
        "TEST F110|2000-03-13T04:00:00.000Z|2000-03-13T05:30:00.000Z",
        "TEST F110|2000-05-08T04:00:00.000Z|2000-05-08T07:00:00.000Z",
      ];
      const timings = ["TEST F110:T4", "TEST F110:T5"];

      for (let i = 0; i < mockUsers.length; i++) {
        await timetableRepository
          .createQueryBuilder()
          .insert()
          .into(Timetable)
          .values({
            name: "Test Timetable",
            authorId: uuids[i],
            degrees: mockUsers[i].degrees,
            private: true,
            draft: true,
            archived: false,
            acadYear: 2022,
            semester: 2,
            year: 2022 - mockUsers[i].batch + 1,
            timings: timings,
            examTimes: examTimes,
            warnings: [],
            createdAt: new Date(),
            lastUpdated: new Date(),
          })
          .execute();
      }
    });

    it("Add sections to a timetable", async () => {
      const timetables = await timetableRepository
        .createQueryBuilder("timetables")
        .getMany();

      const timetable = timetables[0];

      await timetableRepository
        .createQueryBuilder()
        .relation(Timetable, "sections")
        .of(timetable)
        .add(testSection);
    });
  });

  describe("Test removeSections 400 response (invalid timetable id)", () => {
    let response: Response | null = null;

    it("Make API call that expects 400", async () => {
      response = await request.post(`/timetable/abcd/remove`).send({
        email: mockUsers[0].email,
        sectionId: testSection.id,
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
        "timetable id not a number"
      );
    });

    test("Test if error issues path is correct", () => {
      expect(response?.body.issues[0].path).toStrictEqual(["params", "id"]);
    });
  });

  describe("Test removeSections 400 response (missing user email)", () => {
    let response: Response | null = null;

    it("Make API call that expects 400", async () => {
      response = await request.post(`/timetable/1/remove`).send({
        sectionId: testSection.id,
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
        "user email is required"
      );
    });

    test("Test if error issues path is correct", () => {
      expect(response?.body.issues[0].path).toStrictEqual(["body", "email"]);
    });
  });

  describe("Test removeSections 400 (missing user sectionId)", () => {
    let response: Response | null = null;

    it("Make API call that expects 400", async () => {
      response = await request.post(`/timetable/1/remove`).send({
        email: mockUsers[0].email,
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
        "section id is required"
      );
    });

    test("Test if error issues path is correct", () => {
      expect(response?.body.issues[0].path).toStrictEqual([
        "body",
        "sectionId",
      ]);
    });
  });

  describe("Test removeSections 400 (missing both user sectionId and email)", () => {
    let response: Response | null = null;

    it("Make API call that expects 400", async () => {
      response = await request.post(`/timetable/1/remove`);
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns response status 400", () => {
      expect(response?.status).toEqual(400);
    });

    test("Test if error issues are present", () => {
      expect(response?.body.issues).toHaveLength(2);
    });

    test("Test if error name is correct", () => {
      expect(response?.body.name).toEqual("ZodError");
    });

    test("Test if error issues code is correct", () => {
      expect(response?.body.issues[0].code).toEqual("invalid_type");
      expect(response?.body.issues[1].code).toEqual("invalid_type");
    });

    test("Test if error issues message is correct", () => {
      expect(response?.body.issues[0].message).toEqual(
        "user email is required"
      );
      expect(response?.body.issues[1].message).toEqual(
        "section id is required"
      );
    });

    test("Test if error issues path is correct", () => {
      expect(response?.body.issues[0].path).toStrictEqual(["body", "email"]);
      expect(response?.body.issues[1].path).toStrictEqual([
        "body",
        "sectionId",
      ]);
    });
  });

  describe("Test removeSections 400 (invalid user email)", () => {
    let response: Response | null = null;

    it("Make API call that expects 400", async () => {
      response = await request.post(`/timetable/1/remove`).send({
        email: "joewenttoananimalfarm",
        sectionId: testSection.id,
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
        "user email must be a valid email"
      );
    });

    test("Test if error issues path is correct", () => {
      expect(response?.body.issues[0].path).toStrictEqual(["body", "email"]);
    });
  });

  describe("Test removeSections 400 (invalid user sectionId)", () => {
    let response: Response | null = null;

    it("Make API call that expects 400", async () => {
      response = await request.post(`/timetable/1/remove`).send({
        email: mockUsers[0].email,
        sectionId: "joewenttoananimalfarm",
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
      expect(response?.body.issues[0].validation).toEqual("uuid");
    });

    test("Test if error issues code is correct", () => {
      expect(response?.body.issues[0].code).toEqual("invalid_string");
    });

    test("Test if error issues message is correct", () => {
      expect(response?.body.issues[0].message).toEqual(
        "section id must be a valid uuid"
      );
    });

    test("Test if error issues path is correct", () => {
      expect(response?.body.issues[0].path).toStrictEqual([
        "body",
        "sectionId",
      ]);
    });
  });

  describe("Test removeSections 400 (invalid user email and sectionId)", () => {
    let response: Response | null = null;

    it("Make API call that expects 400", async () => {
      response = await request.post(`/timetable/1/remove`).send({
        email: "joewenttoananimalfarm",
        sectionId: "joewenttoananimalfarm",
      });
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns response status 400", () => {
      expect(response?.status).toEqual(400);
    });

    test("Test if error issues are present", () => {
      expect(response?.body.issues).toHaveLength(2);
    });

    test("Test if error name is correct", () => {
      expect(response?.body.name).toEqual("ZodError");
    });

    test("Test if error issues validation is correct", () => {
      expect(response?.body.issues[0].validation).toEqual("regex");
      expect(response?.body.issues[1].validation).toEqual("uuid");
    });

    test("Test if error issues code is correct", () => {
      expect(response?.body.issues[0].code).toEqual("invalid_string");
      expect(response?.body.issues[1].code).toEqual("invalid_string");
    });

    test("Test if error issues message is correct", () => {
      expect(response?.body.issues[0].message).toEqual(
        "user email must be a valid email"
      );
      expect(response?.body.issues[1].message).toEqual(
        "section id must be a valid uuid"
      );
    });

    test("Test if error issues path is correct", () => {
      expect(response?.body.issues[0].path).toStrictEqual(["body", "email"]);
      expect(response?.body.issues[1].path).toStrictEqual([
        "body",
        "sectionId",
      ]);
    });
  });

  describe("Test removeSections 401 (unregistered user)", () => {
    let response: Response | null = null;

    it("Make API call that expects 401", async () => {
      response = await request.post("/timetable/1/remove").send({
        email: "f20230000@hyderabad.bits-pilani.ac.in",
        sectionId: testSection.id,
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

  describe("Test removeSections 404 (timetable not found)", () => {
    let response: Response | null = null;

    it("Make API call expecting 404", async () => {
      response = await request.post("/timetable/420024240/remove").send({
        email: mockUsers[0].email,
        sectionId: testSection.id,
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

  describe("Test removeSections 403 (unauthorised user)", () => {
    let response: Response | null = null;

    it("Make API call that expects 403", async () => {
      response = await request.post("/timetable/1/remove").send({
        email: mockUsers[1].email,
        sectionId: testSection.id,
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

  describe("Test removeSections 200", () => {
    let response: Response | null = null;

    it("Make API call that expects 200", async () => {
      console.log(testSection.id);

      response = await request.post("/timetable/1/remove").send({
        email: mockUsers[0].email,
        sectionId: testSection.id,
      });
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns response status 200", () => {
      expect(response?.status).toEqual(200);
    });

    test("Test if response message is correct", () => {
      expect(response?.body.message).toEqual("section removed");
    });

    test("Test if section has been removed", async () => {
      const response = await timetableRepository
        .createQueryBuilder("timetable")
        .innerJoinAndSelect(
          "timetable.sections",
          "section",
          "section.id = :secid",
          { secid: testSection.id }
        )
        .where("timetable.id = :id", { id: 1 })
        .getOne();

      const section = response?.sections[0];
      expect(section).toBeUndefined();
    });
  });
});
