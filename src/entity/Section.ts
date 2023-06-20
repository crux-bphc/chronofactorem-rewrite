import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  ManyToMany,
} from "typeorm";
import {
  ApprovedSectionTypeList,
  SectionTypeEnum,
} from "../types/sectionTypes";
import { Course } from "./Course";
import { Timetable } from "./Timetable";

@Entity()
export class Section {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @ManyToOne(() => Course, (course) => course.sections)
  course!: Course;

  @Column({
    type: "enum",
    enum: ApprovedSectionTypeList,
  })
  type!: SectionTypeEnum;

  @ManyToMany(() => Timetable, (timetable) => timetable.sections)
  timetables!: Timetable[];

  @Column({ type: "smallint" })
  number: number;

  @Column({ type: "text", array: true })
  instructors!: string[];

  @Column({ name: "room_time", type: "text", array: true })
  roomTime!: string[];

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;
}
