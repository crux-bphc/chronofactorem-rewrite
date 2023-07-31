import app from "../../app";
import { AppDataSource } from "../../db";
import { User } from "../../entity/User";
import { userRepository } from "../../repositories/userRepository";
import supertest, { Response } from "supertest";
import { degreeEnum } from "../../types/degrees";

const request = supertest(app);

beforeAll(async () => {
  await AppDataSource.initialize();
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe("Test Get User Details", () => {
  const userId_1 = "91cc080c-78fe-4dcd-bb52-fb08fec7ec2a";
  const userId_2 = "e5906ce0-bb21-42ee-9250-458b983e8a84";

  const userEmail_1 = "f12345678@hyderabad.bits-pilani.ac.in";

  let response: Response | null = null;

  const testUser_1 = {
    id: userId_1,
    batch: 2021,
    name: "UVW XYZ",
    degrees: ["A7"] as degreeEnum[],
    email: "f20210000@hyderabad.bits-pilani.ac.in",
    timetables: []
  };

  it("Create test data", async () => {
    await userRepository
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({
        id: testUser_1.id,
        name: testUser_1.name,
        email: testUser_1.email,
        batch: testUser_1.batch,
        degrees: testUser_1.degrees,
        timetables: testUser_1.timetables,
      })
      .execute();
  });

  describe("Test with valid userId", () => {
    const userId = userId_1;
    const userEmail = userEmail_1;

    it("Make API call", async () => {
      response = await request.get(`/user/${userId}`).query({
        authEmail: userEmail,
      });
    });

    test("Test if returns truthy response", () => {
       expect(response?.body).toBeTruthy();
     });

    test("Test if the same user is returned", () => {
      const { createdAt: _, ...responseUserWithoutCreatedAt } =
        response?.body as User;

      expect(responseUserWithoutCreatedAt).toEqual(testUser_1);
    });

    test("Test if returns status 200", () => {
      expect(response?.status).toEqual(200);
    });
  });

  describe("Test with invalid userId", () => {
    it("Make API call", async () => {
      const userId = userId_2;
      const userEmail = userEmail_1;

      response = await request.get(`/user/${userId}`).query({
        authEmail: userEmail,
      });
    });

    test("Test if returns truthy response", () => {
       expect(response?.body).toBeTruthy();
     });

    test("Test if returns status 404", () => {
      expect(response?.status).toEqual(404);
    });
  });

  describe("Test with wrong UUID format", () => {
    it("Make API call", async () => {
      const userId = "userId_1";
      const userEmail = userEmail_1;

      response = await request.get(`/user/${userId}`).query({
        authEmail: userEmail,
      });
    });

    test("Test if returns truthy response", () => {
       expect(response?.body).toBeTruthy();
     });

    test("Test if returns status 400", () => {
      expect(response?.status).toEqual(400);
    });
  });

  describe("Test with wrong email format", () => {
    it("Make API call", async () => {
      const userId = userId_1;
      const userEmail = "userEmail_1";

      response = await request.get(`/user/${userId}`).query({
        authEmail: userEmail,
      });
    });

    test("Test if returns truthy response", () => {
       expect(response?.body).toBeTruthy();
     });

    test("Test if returns status 400", () => {
      expect(response?.status).toEqual(400);
    });
  });
});
