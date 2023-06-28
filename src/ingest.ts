import { AppDataSource } from "./db";
import "dotenv/config";
import timetableJSON from "./timetable.json";
import { Course } from "./entity/Course";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { Section } from "./entity/Section";

interface ExamJSON {
  midsem: string;
  compre: string;
}
interface ScheduleJSON {
  room: string;
  days: string[];
  hours: number[];
}
interface SectionJSON {
  instructor: string[];
  schedule: ScheduleJSON[];
}
interface SectionsJSON {
  [key: string]: SectionJSON;
}
interface CourseJSON {
  units: number;
  course_name: string;
  sections: SectionsJSON;
  exams_iso: ExamJSON[];
}
interface CoursesJSON {
  [key: string]: CourseJSON;
}

AppDataSource.initialize()
  .then(async () => {
    // create a query runner to make it easier to create transactions across typeorm function calls
    console.log("connecting to db...");
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    console.log("connected!");
    try {
      await queryRunner.startTransaction();

      const starthrTime = process.hrtime();
      const startTime = starthrTime[0] * 1000 + starthrTime[1] / 1000000;

      const year = timetableJSON.metadata.acadYear;
      const semester = timetableJSON.metadata.semester;
      const courses = timetableJSON.courses as CoursesJSON;

      const sectionValues = [] as QueryDeepPartialEntity<Section>[];

      console.log("constructing courses...");
      const courseValues = Object.keys(courses).map((courseCode) => {
        const midsemTimes = courses[courseCode].exams_iso[0].midsem.split("|");
        const compreTimes = courses[courseCode].exams_iso[0].compre.split("|");
        return {
          code: courseCode,
          name: courses[courseCode].course_name,
          acadYear: year,
          semester: semester,
          archived: false,
          midsemStartTime: new Date(midsemTimes[0]),
          midsemEndTime: new Date(midsemTimes[1]),
          compreTime: new Date(compreTimes[0]),
        } as QueryDeepPartialEntity<Course>;
      });

      console.log("inserting courses...");
      const courseInsertResult = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(Course)
        .values(courseValues)
        .execute();
      console.log("courses inserted!");

      console.log("constructing sections...");
      // grab the IDs of courses because we will use them for relations
      const courseIDs = courseInsertResult.identifiers.map(
        (idObj) => idObj.id as string
      );
      for (let i = 0; i < courseValues.length; i++) {
        // for each course, loop over the sections, and add the room-timings to an array
        Object.keys(courses[courseValues[i].code as string].sections).forEach(
          (courseSectionCode) => {
            const roomTimes = [];
            const scheduleObjs =
              courses[courseValues[i].code as string].sections[
                courseSectionCode
              ].schedule;
            for (let j = 0; j < scheduleObjs.length; j++) {
              for (let k = 0; k < scheduleObjs[j].days.length; k++) {
                for (let l = 0; l < scheduleObjs[j].hours.length; l++) {
                  roomTimes.push(
                    `${scheduleObjs[j].room}:${scheduleObjs[j].days[k]}:${scheduleObjs[j].hours[l]}`
                  );
                }
              }
            }
            // push the section to an array, so we can insert all sections at once
            sectionValues.push({
              course: courseIDs[i],
              instructors:
                courses[courseValues[i].code as string].sections[
                  courseSectionCode
                ].instructor,
              type: courseSectionCode.slice(0, 1),
              number: parseInt(courseSectionCode.slice(1)),
              roomTime: roomTimes,
            } as QueryDeepPartialEntity<Section>);
          }
        );
      }

      console.log("inserting sections...");
      const sectionInsertResult = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(Section)
        .values(sectionValues)
        .execute();
      console.log("sections inserted!");

      await queryRunner.commitTransaction();
      // show summary of the transaction
      console.log("================= SUMMARY =================");
      console.log(`courses inserted: ${courseInsertResult.identifiers.length}`);
      console.log(
        `sections inserted: ${sectionInsertResult.identifiers.length}`
      );
      const endhrTime = process.hrtime();
      const endTime = endhrTime[0] * 1000 + endhrTime[1] / 1000000;
      console.log(
        `Ingestion took ${Math.round((endTime - startTime) * 1000) / 1000}ms`
      );
    } catch (err) {
      // since we have errors let's rollback changes we made
      await queryRunner.rollbackTransaction();
      console.log(`error! err: ${err}`);
    } finally {
      // you need to release query runner which is manually created:
      await queryRunner.release();
    }
  })
  .catch((error) => console.log(error));
