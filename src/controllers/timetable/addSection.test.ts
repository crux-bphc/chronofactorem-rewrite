import app from "../../app";
import { AppDataSource } from "../../db";
import { User } from "../../entity/User";
import { Timetable } from "../../entity/Timetable";
import { Section } from "../../entity/Section";
import { userRepository } from "../../repositories/userRepository";
import { timetableRepository } from "../../repositories/timetableRepository";
import { sectionRepository } from "../../repositories/sectionRepository";
import { courseRepository } from "../../repositories/courseRepository";
import supertest, { Response } from "supertest";
import { degreeEnum } from "../../types/degrees";
import { randomUUID } from "crypto";

const request = supertest(app);

// conditional describe
const describeif = (condition: boolean) =>
  condition ? describe : describe.skip;

beforeAll(async () => {
  await AppDataSource.initialize();
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe("Test addSection", () => {
  let nonExistentUUID = randomUUID();

  let response: Response | null = null;
  let allSections: Section[] | null = null;

  // Sections to test clashing class timings
  let foundSectionsWithClashingClassTimings = false;
  let testSection_1: Section | null = null;
  let testSection_2: Section | null = null;

  // Sections to test clash if section in the same course
  // with the same type is attempted to be added again
  let foundSectionsWithClashingSectionType = false;
  let testSection_3: Section | null = null;
  let testSection_4: Section | null = null;

  // Sections to test clashing exam timings
  let foundSectionsWithClashingExamTimings = false;
  let testSection_5: Section | null = null;
  let testSection_6: Section | null = null;
  let crashCourse: string | null = null;
  let crashExam: string | null = null;

  it("Get all sections and create test sections from db", async () => {
    allSections = await sectionRepository.createQueryBuilder().getMany();

    while (allSections.some((section) => section.id === nonExistentUUID)) {
      nonExistentUUID = randomUUID();
    }

    const checkForClashingClassTimings = (
      section_1: Section,
      section_2: Section
    ): boolean => {
      for (const roomTime_1 of section_1.roomTime) {
        for (const roomTime_2 of section_2.roomTime) {
          const [_, day_1, hour_1] = roomTime_1.split(":");
          const [_0, day_2, hour_2] = roomTime_2.split(":");

          if (day_1 == day_2 && hour_1 == hour_2) {
            return true; // clashing timings found
          }
        }
      }

      return false; // no clashing timings found
    };

    const checkForClashingSectionType = (
      section_1: Section,
      section_2: Section
    ): boolean => {
      if (
        section_2.courseId == section_1.courseId &&
        section_2.type == section_1.type
      ) {
        return true; // clashing section type found
      } else {
        return false;
      }
    };

    const checkForClashingExamTimings = async (
      section_1: Section,
      section_2: Section
    ) => {
      const course_1 = await courseRepository
        .createQueryBuilder("course")
        .where("course.id = :courseId", { courseId: section_1.courseId })
        .getOne();

      const course_2 = await courseRepository
        .createQueryBuilder("course")
        .where("course.id = :courseId", { courseId: section_2.courseId })
        .getOne();

      if (course_1!.code == course_2!.code) {
        return {
          clash: false,
          exam: null,
          course: null,
          sameCourse: true,
        };
      }

      const midsemStartTimeCourse_1 = course_1!.midsemStartTime;
      const midsemEndTimeCourse_1 = course_1!.midsemEndTime;
      const midsemStartTimeCourse_2 = course_2!.midsemStartTime;
      const midsemEndTimeCourse_2 = course_2!.midsemEndTime;

      if (
        (midsemStartTimeCourse_2 <= midsemStartTimeCourse_1 &&
          midsemEndTimeCourse_2 >= midsemStartTimeCourse_1) ||
        (midsemStartTimeCourse_2 <= midsemEndTimeCourse_1 &&
          midsemEndTimeCourse_2 >= midsemEndTimeCourse_1) ||
        (midsemStartTimeCourse_2 >= midsemStartTimeCourse_1 &&
          midsemEndTimeCourse_2 <= midsemEndTimeCourse_1)
      ) {
        return {
          clash: true,
          exam: "midsem",
          course: course_1!.code,
          sameCourse: false,
        };
      }

      const compreStartTimeCourse_1 = course_1!.compreStartTime;
      const compreEndTimeCourse_1 = course_1!.compreEndTime;
      const compreStartTimeCourse_2 = course_2!.compreStartTime;
      const compreEndTimeCourse_2 = course_2!.compreEndTime;

      if (
        (compreStartTimeCourse_2 <= compreStartTimeCourse_1 &&
          compreEndTimeCourse_2 >= compreStartTimeCourse_1) ||
        (compreStartTimeCourse_2 <= compreEndTimeCourse_1 &&
          compreEndTimeCourse_2 >= compreEndTimeCourse_1) ||
        (compreStartTimeCourse_2 >= compreStartTimeCourse_1 &&
          compreEndTimeCourse_2 <= compreEndTimeCourse_1)
      ) {
        return {
          clash: true,
          exam: "compre",
          course: course_1!.code,
          sameCourse: false,
        };
      }

      return {
        clash: false,
        exam: null,
        course: null,
        sameCourse: false,
      };
    };

    outerLoop: for (let i = 0; i < allSections.length; i++) {
      for (let j = i + 1; j < allSections.length; j++) {
        const section1 = allSections[i];
        const section2 = allSections[j];

        if (checkForClashingClassTimings(section1, section2)) {
          testSection_1 = section1;
          testSection_2 = section2;
          foundSectionsWithClashingClassTimings = true;
          break outerLoop;
        }
      }
    }

    // Use generic sections if no sections are found with clashing class timings
    if (testSection_1 == null && testSection_2 == null) {
      testSection_1 = allSections[0];
      testSection_2 = allSections[1];
    }

    outerLoop: for (let i = 0; i < allSections.length; i++) {
      for (let j = i + 1; j < allSections.length; j++) {
        const section1 = allSections[i];
        const section2 = allSections[j];

        if (checkForClashingSectionType(section1, section2)) {
          testSection_3 = section1;
          testSection_4 = section2;
          foundSectionsWithClashingSectionType = true;
          break outerLoop;
        }
      }
    }

    // Use generic sections if no sections are found with within same course with the same type
    // if (testSection_3 == null && testSection_4 == null) {
    //   testSection_3 = allSections[0];
    //   testSection_4 = allSections[1];
    // }

    outerLoop: for (let i = 0; i < allSections.length; i++) {
      for (let j = i + 1; j < allSections.length; j++) {
        const section1 = allSections[i];
        const section2 = allSections[j];

        const a = await checkForClashingExamTimings(section1, section2);

        if (a.clash && !a.sameCourse) {
          testSection_5 = section1;
          testSection_6 = section2;
          foundSectionsWithClashingExamTimings = true;
          crashCourse = a.course!;
          crashExam = a.exam!;
          break outerLoop;
        }
      }
    }

    // Use generic sections if no sections are found with clashing exam timings
    // if (testSection_5 == null && testSection_6 == null) {
    //   testSection_5 = allSections[0];
    //   testSection_6 = allSections[1];
    // }
  });

  const testUsers = [
    {
      batch: 2022,
      name: "UVW XYZ",
      degrees: ["A2"] as degreeEnum[],
      email: "f20220000@hyderabad.bits-pilani.ac.in",
    },
    {
      batch: 2021,
      name: "ABC DEF",
      degrees: ["B3", "A7"] as degreeEnum[],
      email: "f20210000@hyderabad.bits-pilani.ac.in",
    },
  ];

  let userData: User[] = [];

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
        const timetableValueList = Array.from({ length: 3 }, (_, index) => ({
          name: `Test Timetable ${index + 1}`,
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
        }));

        await timetableRepository
          .createQueryBuilder()
          .insert()
          .into(Timetable)
          .values(timetableValueList)
          .execute();
      }
    });

    it("Store test timetables", async () => {
      userData = await userRepository
        .createQueryBuilder("user")
        .orderBy("user.batch", "DESC")
        .leftJoin("user.timetables", "timetable")
        .select(["user", "timetable"])
        .getMany();
    });
  });

  describe("Test addSection with invalid email and invalid sectionID", () => {
    it("Make API call", async () => {
      const timetable = userData[0].timetables[0];
      response = await request.post(`/timetable/${timetable.id}/add`).send({
        email: "invalidEmail",
        sectionId: "invalidSectionId",
      });
    });

    it("Test if response is truthy", () => {
      expect(response?.body).toBeTruthy();
    });

    it("Test if response status is 400", () => {
      expect(response?.status).toEqual(400);
    });

    it("Test if response has error message", () => {
      expect(response?.body).toHaveProperty("issues");
      expect(response?.body.issues[0]).toHaveProperty("message");
      expect(response?.body.issues[1]).toHaveProperty("message");
    });

    it("Test if error message is correct", () => {
      expect(response?.body.issues[0].message).toEqual(
        "user email must be a valid email"
      );
      expect(response?.body.issues[1].message).toEqual(
        "section id must be a valid uuid"
      );
    });
  });

  describe("Test addSection with unregistered email and non-existent sectionID", () => {
    it("Make API call", async () => {
      const timetable = userData[0].timetables[0];

      response = await request.post(`/timetable/${timetable.id}/add`).send({
        email: "f20229999@hyderabad.bits-pilani.ac.in",
        sectionId: nonExistentUUID,
      });
    });

    it("Test if response is truthy", () => {
      expect(response?.body).toBeTruthy();
    });

    it("Test if response status is 401", () => {
      expect(response?.status).toEqual(401);
    });

    it("Test if response has error message", () => {
      expect(response?.body).toHaveProperty("message");
    });

    it("Test if error message is correct", () => {
      expect(response?.body.message).toEqual("unregistered user");
    });
  });

  describe("Test addSection with registered email and non-existent sectionID", () => {
    it("Make API call", async () => {
      const timetable = userData[0].timetables[0];
      response = await request.post(`/timetable/${timetable.id}/add`).send({
        email: userData[0].email,
        sectionId: nonExistentUUID,
      });
    });

    it("Test if response is truthy", () => {
      expect(response?.body).toBeTruthy();
    });

    it("Test if response status is 404", () => {
      expect(response?.status).toEqual(404);
    });

    it("Test if response has error message", () => {
      expect(response?.body).toHaveProperty("message");
    });

    it("Test if error message is correct", () => {
      expect(response?.body.message).toEqual("section not found");
    });
  });

  describe("Test addSection with registered email and existing sectionID", () => {
    it("Make API call", async () => {
      const timetable = userData[0].timetables[0];
      response = await request.post(`/timetable/${timetable.id}/add`).send({
        email: userData[0].email,
        sectionId: testSection_1!.id,
      });
    });

    it("Test if response is truthy", () => {
      expect(response?.body).toBeTruthy();
    });

    it("Test if response status is 200", () => {
      expect(response?.status).toEqual(200);
    });

    it("Test if response has message", () => {
      expect(response?.body).toHaveProperty("message");
    });

    it("Test if message is correct", () => {
      expect(response?.body.message).toEqual("section added");
    });
  });

  describe("Test addSection with inaccurate timetable id", () => {
    it("Make API call", async () => {
      response = await request.post(`/timetable/6969/add`).send({
        email: userData[0].email,
        sectionId: testSection_1!.id,
      });
    });

    it("Test if response is truthy", () => {
      expect(response?.body).toBeTruthy();
    });

    it("Test if response status is 404", () => {
      expect(response?.status).toEqual(404);
    });

    it("Test if response has error message", () => {
      expect(response?.body).toHaveProperty("message");
    });

    it("Test if error message is correct", () => {
      expect(response?.body.message).toEqual("timetable not found");
    });
  });

  describe("Test addSection but it's not the user's timetable", () => {
    it("Make API call", async () => {
      const timetable = userData[0].timetables[0];
      response = await request.post(`/timetable/${timetable.id}/add`).send({
        email: userData[1].email,
        sectionId: testSection_1!.id,
      });
    });

    it("Test if response is truthy", () => {
      expect(response?.body).toBeTruthy();
    });

    it("Test if response status is 403", () => {
      expect(response?.status).toEqual(403);
    });

    it("Test if response has error message", () => {
      expect(response?.body).toHaveProperty("message");
    });

    it("Test if error message is correct", () => {
      expect(response?.body.message).toEqual("user does not own timetable");
    });
  });

  describeif(foundSectionsWithClashingClassTimings)(
    "Test addSection with clashing course hours",
    () => {
      it("Make API call", async () => {
        const timetable = userData[0].timetables[0];

        response = await request.post(`/timetable/${timetable.id}/add`).send({
          email: userData[0].email,
          sectionId: testSection_2!.id,
        });
      });

      it("Test if response is truthy", () => {
        expect(response?.body).toBeTruthy();
      });

      it("Test if response status is 400", () => {
        expect(response?.status).toEqual(400);
      });

      it("Test if response has error message", () => {
        expect(response?.body).toHaveProperty("message");
      });

      it("Test if error message is correct", async () => {
        const clashingCourse = await courseRepository
          .createQueryBuilder("course")
          .select("course.code")
          .where("course.id = :courseId", { courseId: testSection_1!.courseId })
          .getOne();

        expect(response?.body.message).toEqual(
          `section clashes with ${clashingCourse?.code}`
        );
      });
    }
  );

  describeif(foundSectionsWithClashingSectionType)(
    "Test addSection by adding multiple sections in the same course of same type",
    () => {
      it("Make API call", async () => {
        const timetable = userData[0].timetables[1];

        response = await request.post(`/timetable/${timetable.id}/add`).send({
          email: userData[0].email,
          sectionId: testSection_3!.id,
        });

        response = await request.post(`/timetable/${timetable.id}/add`).send({
          email: userData[0].email,
          sectionId: testSection_4!.id,
        });
      });

      it("Test if response is truthy", () => {
        expect(response?.body).toBeTruthy();
      });

      it("Test if response status is 400", () => {
        expect(response?.status).toEqual(400);
      });

      it("Test if response has error message", () => {
        expect(response?.body).toHaveProperty("message");
      });

      it("Test if error message is correct", () => {
        expect(response?.body.message).toEqual(
          `can't have multiple sections of type ${testSection_3!.type}`
        );
      });
    }
  );

  describeif(foundSectionsWithClashingExamTimings)(
    "Test addSection with clashing exam times",
    () => {
      it("Make API call", async () => {
        const timetable = userData[0].timetables[2];

        response = await request.post(`/timetable/${timetable.id}/add`).send({
          email: userData[0].email,
          sectionId: testSection_5!.id,
        });

        response = await request.post(`/timetable/${timetable.id}/add`).send({
          email: userData[0].email,
          sectionId: testSection_6!.id,
        });
      });

      it("Test if response is truthy", () => {
        expect(response?.body).toBeTruthy();
      });

      it("Test if response status is 400", () => {
        expect(response?.status).toEqual(400);
      });

      it("Test if response has error message", () => {
        expect(response?.body).toHaveProperty("message");
      });

      it("Test if error message is correct", () => {
        expect(response?.body.message).toEqual(
          `course's exam clashes with ${crashCourse}'s ${crashExam}`
        );
      });
    }
  );
});
