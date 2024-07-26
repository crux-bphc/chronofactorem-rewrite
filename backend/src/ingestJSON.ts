import { QueryRunner } from "typeorm";
import { sectionTypeEnum } from "../../lib/src/index.js";
import { env } from "./config/server.js";
import { Course, Section, Timetable } from "./entity/entities.js";
import { addTimetable } from "./utils/search.js";
import sqids from "./utils/sqids.js";

interface ExamJSON {
  midsem: string | null;
  compre: string | null;
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
interface MetadataJSON {
  acadYear: number;
  semester: number;
}

interface TimetableJSON {
  courses: CoursesJSON;
  metadata: MetadataJSON;
}

export const ingestJSON = async (
  timetableJSON: TimetableJSON,
  queryRunner: QueryRunner,
) => {
  try {
    await queryRunner.startTransaction();

    const starthrTime = process.hrtime();
    const startTime = starthrTime[0] * 1000 + starthrTime[1] / 1000000;

    const year = timetableJSON.metadata.acadYear;
    const semester = timetableJSON.metadata.semester;
    const forceOverwrite = process.argv[2] && process.argv[2] === "--overwrite";
    let archivedCoursesUpdateCount = 0;
    let archivedTimetablesUpdateCount = 0;
    let archivedTimetablesDeleteCount = 0;

    const latestCourse = await queryRunner.manager
      .createQueryBuilder(Course, "course")
      .orderBy("course.acad_year", "DESC")
      .orderBy("course.semester", "DESC")
      .getOne();

    if (latestCourse !== null) {
      // Do some basic year and semester checking
      if (latestCourse.acadYear > year) {
        console.error(
          `error: timetable.json is outdated; latest course academic year is ${latestCourse.acadYear} while the timetable is of academic year ${year}`,
        );
        throw Error(
          `error: timetable.json is outdated; latest course academic year is ${latestCourse.acadYear} while the timetable is of academic year ${year}`,
        );
      }
      if (latestCourse.acadYear === year) {
        if (latestCourse.semester > semester) {
          console.error(
            `error: timetable.json is outdated; latest course academic year is ${latestCourse.acadYear} and semester is ${latestCourse.semester} while the timetable is of academic year ${year} and semester ${semester}`,
          );
          throw Error(
            `error: timetable.json is outdated; latest course academic year is ${latestCourse.acadYear} and semester is ${latestCourse.semester} while the timetable is of academic year ${year} and semester ${semester}`,
          );
        }
        if (latestCourse.semester === semester) {
          // If forceOverwrite is not set, then show error
          if (!forceOverwrite) {
            console.log(
              `error: timetable.json is of same semester; latest course academic year is ${latestCourse.acadYear} and semester is ${latestCourse.semester} while the timetable is of academic year ${year} and semester ${semester}`,
            );
            console.log(
              "since the --overwrite flag has not been passed, the courses for this semester will not be overwritten",
            );
            console.log(
              "if you wish to overwrite the courses for this semester, set this value to true",
            );
            console.log(
              "WARNING: overwriting will wipe all courses, sections, and timetables for that combination of academic year and semester",
            );
            return;
          }

          // Else, delete old timetables and courses
          console.log(
            "WARNING: overwriting will wipe all courses, sections, and timetables for that combination of academic year and semester",
          );

          console.log(
            "You have 30 seconds to rethink what you're about to do...",
          );
          await new Promise((resolve) => {
            setTimeout(resolve, 30000);
          });

          console.log(
            `deleting timetables from academic year ${latestCourse.acadYear} and semester ${latestCourse.semester}...`,
          );
          const deletedTimetableResult = await queryRunner.manager
            .createQueryBuilder()
            .delete()
            .from(Timetable)
            .where("acad_year = :year", { year: latestCourse.acadYear })
            .andWhere("semester = :semester", {
              semester: latestCourse.semester,
            })
            .execute();
          console.log(
            `deleted ${deletedTimetableResult.affected} timetables from academic year ${latestCourse.acadYear} and semester ${latestCourse.semester}!`,
          );

          console.log(
            `deleting courses from academic year ${latestCourse.acadYear} and semester ${latestCourse.semester}...`,
          );
          const deletedCourseResult = await queryRunner.manager
            .createQueryBuilder()
            .delete()
            .from(Course)
            .where("acad_year = :year", { year: latestCourse.acadYear })
            .andWhere("semester = :semester", {
              semester: latestCourse.semester,
            })
            .execute();
          console.log(
            `deleted ${deletedCourseResult.affected} courses from academic year ${latestCourse.acadYear} and semester ${latestCourse.semester}!`,
          );
        }
      }

      // Overwriting and checking validity of ingestion is done, so now run normal ingestion
      console.log("marking all old courses as archived...");
      const archivedCoursesUpdateResult = await queryRunner.manager
        .createQueryBuilder()
        .update(Course)
        .set({ archived: true })
        .where("acad_year = :year", { year: latestCourse.acadYear })
        .andWhere("semester = :semester", {
          semester: latestCourse.semester,
        })
        .execute();
      archivedCoursesUpdateCount = archivedCoursesUpdateResult.affected ?? 0;
      console.log("marked old courses as archived!");

      console.log("marking all old non-draft timetables as archived...");
      const archivedTimetablesUpdateResult = await queryRunner.manager
        .createQueryBuilder()
        .update(Timetable)
        .set({ archived: true })
        .where("acad_year = :year", { year: latestCourse.acadYear })
        .andWhere("semester = :semester", {
          semester: latestCourse.semester,
        })
        .andWhere("draft = :draft", {
          draft: false,
        })
        .execute();
      archivedTimetablesUpdateCount =
        archivedTimetablesUpdateResult.affected ?? 0;
      console.log("marked old non-draft timetables as archived!");

      console.log("deleting all old draft timetables...");
      const archiveDeletedTimetablesUpdateResult = await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(Timetable)
        .where("acad_year = :year", { year: latestCourse.acadYear })
        .andWhere("semester = :semester", {
          semester: latestCourse.semester,
        })
        .andWhere("draft = :draft", {
          draft: true,
        })
        .execute();
      archivedTimetablesDeleteCount =
        archiveDeletedTimetablesUpdateResult.affected ?? 0;
      console.log("deleted old draft timetables!");

      console.log("checking if all existing courses are archived...");
      const allCoursesCountResult = await queryRunner.manager
        .createQueryBuilder()
        .select()
        .from(Course, "course")
        .getCount();
      const archivedCoursesCountResult = await queryRunner.manager
        .createQueryBuilder()
        .select()
        .from(Course, "course")
        .where("archived = :archived", { archived: true })
        .getCount();
      console.log(
        `${archivedCoursesCountResult}/${allCoursesCountResult} courses are archived`,
      );
      if (archivedCoursesCountResult !== allCoursesCountResult) {
        console.error(
          "error: not all courses in db are archived; db state inconsistent",
        );
        throw Error(
          "error: not all courses in db are archived; db state inconsistent",
        );
      }
      console.log("finished checking courses!");

      console.log("checking if all existing timetables are archived...");
      const allTimetablesCountResult = await queryRunner.manager
        .createQueryBuilder()
        .select()
        .from(Timetable, "timetable")
        .getCount();
      const archivedTimetablesCountResult = await queryRunner.manager
        .createQueryBuilder()
        .select()
        .from(Timetable, "timetable")
        .where("archived = :archived", { archived: true })
        .getCount();
      console.log(
        `${archivedTimetablesCountResult}/${allTimetablesCountResult} timetables are archived`,
      );
      if (archivedTimetablesCountResult !== allTimetablesCountResult) {
        console.error(
          "error: not all timetables in db are archived; db state inconsistent",
        );
        throw Error(
          "error: not all timetables in db are archived; db state inconsistent",
        );
      }
      console.log("finished checking timetables!");
    }

    const courses = timetableJSON.courses as CoursesJSON;

    const sectionValues = [];

    console.log("constructing courses...");
    const courseValues = Object.keys(courses).map((courseCode) => {
      const midsemTimes = courses[courseCode].exams_iso[0].midsem;
      const compreTimes = courses[courseCode].exams_iso[0].compre;
      return {
        code: courseCode,
        name: courses[courseCode].course_name,
        acadYear: year,
        semester: semester,
        archived: false,
        midsemStartTime: midsemTimes
          ? new Date(midsemTimes.split("|")[0])
          : undefined,
        midsemEndTime: midsemTimes
          ? new Date(midsemTimes.split("|")[1])
          : undefined,
        compreStartTime: compreTimes
          ? new Date(compreTimes.split("|")[0])
          : undefined,
        compreEndTime: compreTimes
          ? new Date(compreTimes.split("|")[1])
          : undefined,
      };
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
      (idObj) => idObj.id as string,
    );
    for (let i = 0; i < courseValues.length; i++) {
      // for each course, loop over the sections, and add the room-timings to an array
      for (const courseSectionCode of Object.keys(
        courses[courseValues[i].code as string].sections,
      )) {
        const roomTimes = [];
        const scheduleObjs =
          courses[courseValues[i].code as string].sections[courseSectionCode]
            .schedule;
        for (let j = 0; j < scheduleObjs.length; j++) {
          for (let k = 0; k < scheduleObjs[j].days.length; k++) {
            for (let l = 0; l < scheduleObjs[j].hours.length; l++) {
              roomTimes.push(
                `${courseValues[i].code}:${scheduleObjs[j].room}:${scheduleObjs[j].days[k]}:${scheduleObjs[j].hours[l]}`,
              );
            }
          }
        }
        // push the section to an array, so we can insert all sections at once
        sectionValues.push({
          courseId: courseIDs[i],
          instructors:
            courses[courseValues[i].code as string].sections[courseSectionCode]
              .instructor,
          type: courseSectionCode.slice(0, 1) as sectionTypeEnum,
          number: parseInt(courseSectionCode.slice(1)),
          roomTime: roomTimes,
        });
      }
    }

    console.log("inserting sections...");
    const sectionInsertResult = await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into(Section)
      .values(sectionValues)
      .execute();
    console.log("sections inserted!");

    console.log("removing old courses from search service...");
    const [oldCourseIds, oldCourseCount] = await queryRunner.manager
      .createQueryBuilder()
      .select("course.id")
      .from(Course, "course")
      .where("course.archived = :archived", { archived: true })
      .getManyAndCount();
    console.log(`${oldCourseCount} old courses found`);
    for (const { id } of oldCourseIds) {
      try {
        const searchServiceURL = `${env.SEARCH_SERVICE_URL}/course/remove`;
        const res = await fetch(searchServiceURL, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) {
          const resJson = await res.json();
          console.log(
            `error while removing course ${id} from search service: ${resJson.error}`,
          );
        }
      } catch (err: any) {
        console.log(
          `error while removing course ${id} from search service: ${err.message}`,
        );
      }
    }
    console.log("removed old courses from search service!");

    console.log("adding updated courses into search service...");
    const [updatedCourseIds, updatedCourseCount] = await queryRunner.manager
      .createQueryBuilder()
      .select("course.id")
      .from(Course, "course")
      .getManyAndCount();
    console.log(`${updatedCourseCount} courses found`);
    for (const { id } of updatedCourseIds) {
      const course = await queryRunner.manager
        .createQueryBuilder()
        .select("course")
        .from(Course, "course")
        .leftJoinAndSelect("course.sections", "section")
        .where("course.id = :id", { id: id })
        .getOne();
      try {
        const searchServiceURL = `${env.SEARCH_SERVICE_URL}/course/add`;
        const res = await fetch(searchServiceURL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(course),
        });
        if (!res.ok) {
          const resJson = await res.json();
          console.log(
            `error while adding course ${id} to search service: ${resJson.error}`,
          );
        }
      } catch (err: any) {
        console.log(
          `error while adding course ${id} to search service: ${err.message}`,
        );
      }
    }
    console.log("added updated courses to search service!");

    console.log("updating timetables in search service...");
    const [timetableIds, timetableCount] = await queryRunner.manager
      .createQueryBuilder()
      .select("timetable.id")
      .from(Timetable, "timetable")
      .where("timetable.archived = :archived", { archived: true })
      .getManyAndCount();
    console.log(`${timetableCount} timetables are to be updated`);
    for (const { id } of timetableIds) {
      const encodedId = sqids.encode([id]);
      try {
        const searchServiceURL = `${env.SEARCH_SERVICE_URL}/timetable/remove`;
        const res = await fetch(searchServiceURL, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: encodedId }),
        });
        if (!res.ok) {
          const resJson = await res.json();
          console.log(
            `error while removing timetable ${id} from search service: ${resJson.error}`,
          );
        }
      } catch (err: any) {
        console.log(
          `error while removing timetable ${id} from search service: ${err.message}`,
        );
      }
      try {
        const timetable = await queryRunner.manager
          .createQueryBuilder()
          .select("timetable")
          .from(Timetable, "timetable")
          .leftJoinAndSelect("timetable.sections", "section")
          .where("timetable.id = :id", { id })
          .getOneOrFail();
        addTimetable(timetable, null, console);
      } catch (err: any) {
        console.log(
          `error while adding timetable ${id} to search service: ${err.message}`,
        );
      }
    }
    console.log("updated timetables in search service!");

    await queryRunner.commitTransaction();
    // show summary of the transaction
    console.log("================= SUMMARY =================");
    console.log(`courses archived: ${archivedCoursesUpdateCount}`);
    console.log(`timetables archived: ${archivedTimetablesUpdateCount}`);
    console.log(
      `timetables deleted while archiving: ${archivedTimetablesDeleteCount}`,
    );
    console.log(`courses inserted: ${courseInsertResult.identifiers.length}`);
    console.log(`sections inserted: ${sectionInsertResult.identifiers.length}`);
    const endhrTime = process.hrtime();
    const endTime = endhrTime[0] * 1000 + endhrTime[1] / 1000000;
    console.log(
      `Ingestion took ${Math.round((endTime - startTime) * 1000) / 1000}ms`,
    );
  } catch (err) {
    // since we have errors let's rollback changes we made
    await queryRunner.rollbackTransaction();
    console.log(`error! err: ${err}`);
  }
};
