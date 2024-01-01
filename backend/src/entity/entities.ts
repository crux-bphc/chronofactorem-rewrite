import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import {
  approvedDegreeList,
  approvedSectionTypeList,
  degreeEnum,
  sectionTypeEnum,
} from "../../../lib/src/index.js";

@Entity()
export class SearchHistory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_email_hash", type: "varchar", length: 100 })
  userEmailHash!: string;

  @Column({ name: "search_term", type: "varchar", length: 200 })
  searchTerm!: string;

  @CreateDateColumn({
    name: "searched_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  searchedAt!: Date;
}

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ unique: true, type: "varchar", length: 38 })
  email!: string;

  @Column({ type: "smallint" })
  batch!: number;

  @Column({ type: "varchar", length: 200 })
  name!: string;

  @Column({
    type: "enum",
    array: true,
    enum: approvedDegreeList,
  })
  degrees!: degreeEnum[];

  @OneToMany(
    () => Timetable,
    (timetable) => timetable.author,
  )
  timetables!: Timetable[];

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;
}

@Entity()
export class Timetable {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Index()
  @Column("uuid")
  authorId!: string;

  @ManyToOne(
    () => User,
    (author) => author.timetables,
  )
  @JoinColumn()
  author!: User;

  @Column({ type: "varchar", length: 200 })
  name!: string;

  @Column({
    type: "enum",
    array: true,
    enum: approvedDegreeList,
  })
  degrees!: degreeEnum[];

  @Column({ type: "boolean", default: true })
  private!: boolean;

  @Column({ type: "boolean", default: true })
  draft!: boolean;

  @Column({ type: "boolean", default: false })
  archived!: boolean;

  @Column({ type: "smallint" })
  year!: number;

  @Column({ name: "acad_year", type: "smallint" })
  acadYear!: number;

  @Column({ type: "smallint" })
  semester!: number;

  @JoinTable()
  @ManyToMany(
    () => Section,
    (section) => section.timetables,
  )
  sections!: Section[];

  @Column({ type: "varchar", length: 20, array: true })
  timings!: string[];

  @Column({ name: "exam_times", type: "varchar", array: true })
  // e.g. ["CS F211:2021-04-20T09:00:00.000Z|2021-04-20T11:00:00.000Z"]
  examTimes!: string[];

  // e.g. ["CS F211-LP", "CS F212-L"]
  @Column({ type: "varchar", length: 30, array: true })
  warnings!: string[];

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "last_updated",
    type: "timestamptz",
    onUpdate: "CURRENT_TIMESTAMP",
    nullable: true,
  })
  lastUpdated!: Date;
}

@Entity()
@Unique(["code", "acadYear", "semester"])
export class Course {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar", length: 30 })
  code!: string;

  @Column({ type: "varchar", length: 50 })
  name!: string;

  @OneToMany(
    () => Section,
    (section) => section.course,
  )
  sections!: Section[];

  @Column({ name: "midsem_start_time", type: "timestamptz", nullable: true })
  midsemStartTime!: Date;

  @Column({ name: "midsem_end_time", type: "timestamptz", nullable: true })
  midsemEndTime!: Date;

  @Column({ name: "compre_start_time", type: "timestamptz", nullable: true })
  compreStartTime!: Date;

  @Column({ name: "compre_end_time", type: "timestamptz", nullable: true })
  compreEndTime!: Date;

  @Column({ type: "boolean", default: false })
  archived!: boolean;

  @Column({ name: "acad_year", type: "smallint" })
  acadYear!: number;

  @Column({ type: "smallint" })
  semester!: number;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;
}

@Entity()
export class Section {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column("uuid")
  courseId!: string;

  @ManyToOne(
    () => Course,
    (course) => course.sections,
    { onDelete: "CASCADE" },
  )
  @JoinColumn()
  course!: Course;

  @Column({
    type: "enum",
    enum: approvedSectionTypeList,
  })
  type!: sectionTypeEnum;

  @ManyToMany(
    () => Timetable,
    (timetable) => timetable.sections,
  )
  timetables!: Timetable[];

  @Column({ type: "smallint" })
  number!: number;

  @Column({ type: "varchar", length: 100, array: true })
  instructors!: string[];

  @Column({ name: "room_time", type: "varchar", length: 51, array: true })
  roomTime!: string[];

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;
}
