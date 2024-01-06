import supertest, { Response } from "supertest";
import { AppDataSource } from "../../db";
import app from "../../app";
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

describe("Test editUser", () => {
  const testUsers = [
    {
      batch: 2021,
      name: "MAN IAM",
      degrees: ["A7"] as degreeEnum[],
      email: "f20213127@hyderabad.bits-pilani.ac.in",
    },
    {
      batch: 2022,
      name: "LOSING IT",
      degrees: ["B3", "A7"] as degreeEnum[],
      email: "f20224312@hyderabad.bits-pilani.ac.in",
    },
  ];

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
  });

  describe("Test editUser 400 (invalid degrees)", () => {
    let response: Response | null = null;

    it("Make API call expecting 400", async () => {
      response = await request.post(`/user/edit`).send({
        email: testUsers[0].email,
        degrees: ["A7", "B6", "A1"],
      });
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns response status 400", () => {
      expect(response?.status).toEqual(400);
    });

    test("Test if error message is correct", () => {
      expect(response?.body.issues[0].message).toEqual(
        "user degrees may not contain more than two elements"
      );
    });
  });

  describe("Test editUser 400 (invalid degrees)", () => {
    let response: Response | null = null;

    it("Make API call expecting 400", async () => {
      response = await request.post(`/user/edit`).send({
        email: testUsers[0].email,
        degrees: [],
      });
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns response status 400", () => {
      expect(response?.status).toEqual(400);
    });

    test("Test if error message is correct", () => {
      expect(response?.body.issues[0].message).toEqual(
        "user degrees must be a non-empty array of valid degree strings"
      );
    });
  });

  describe("Test editUser 200 (valid degrees)", () => {
    let response: Response | null = null;

    it("Make API call expecting 200", async () => {
      response = await request.post(`/user/edit`).send({
        email: testUsers[0].email,
        degrees: ["A7", "B3"],
      });
    });

    test("Test if returns truthy response", () => {
      expect(response?.body).toBeTruthy();
    });

    test("Test if returns response status 200", () => {
      expect(response?.status).toEqual(200);
    });

    test("Test if success message is correct", () => {
      expect(response?.body.message).toEqual(
        "User details updated successfully"
      );
    });
  });
});
