import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  ManyToMany,
  JoinColumn,
} from "typeorm";
import {
  approvedSectionTypeList,
  sectionTypeEnum,
} from "../types/sectionTypes";
import { Course } from "./Course";
import { Timetable } from "./Timetable";

@Entity()
export class Section {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column("uuid")
  courseId!: string;

  @ManyToOne(() => Course, (course) => course.sections, { onDelete: "CASCADE" })
  @JoinColumn()
  course!: Course;

  @Column({
    type: "enum",
    enum: approvedSectionTypeList,
  })
  type!: sectionTypeEnum;

  @ManyToMany(() => Timetable, (timetable) => timetable.sections)
  timetables!: Timetable[];

  @Column({ type: "smallint" })
  number!: number;

  @Column({ type: "varchar", length: 100, array: true })
  instructors!: string[];

  @Column({ name: "room_time", type: "varchar", length: 20, array: true })
  roomTime!: string[];

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;
}
