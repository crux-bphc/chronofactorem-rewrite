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
  ApprovedSectionTypeList,
  NamedSectionTypeZodEnum,
  SectionTypeEnum,
} from "../types/sectionTypes";
import { Course } from "./Course";
import { Timetable } from "./Timetable";
import {
  addNameToString,
  namedISOTimestampType,
  namedIntegerType,
  namedNonEmptyStringType,
  namedUUIDType,
} from "../types/zodFieldTypes";
import { z } from "zod";

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
    enum: ApprovedSectionTypeList,
  })
  type!: SectionTypeEnum;

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

export const namedSectionType = (name?: string) =>
  z.object({
    id: namedUUIDType(name),
    courseId: namedUUIDType(addNameToString("courseId", name)),
    type: NamedSectionTypeZodEnum(name),
    number: namedIntegerType(addNameToString("number", name)),
    instructors: namedNonEmptyStringType(
      addNameToString("instructors", name)
    ).array(),
    roomTime: namedNonEmptyStringType(
      addNameToString("room-time", name)
    ).array(),
    createdAt: namedISOTimestampType(addNameToString("createdAt", name)),
  });

export const sectionType = namedSectionType();
