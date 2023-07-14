import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  OneToMany,
  Unique,
} from "typeorm";
import { z } from "zod";
import {
  addNameToString,
  namedBooleanType,
  namedISOTimestampType,
  namedNonEmptyStringType,
  namedSemesterType,
  namedUUIDType,
  namedYearType,
} from "../types/zodFieldTypes";
import { Section } from "./Section";

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

  @OneToMany(() => Section, (section) => section.course)
  sections!: Section[];

  @Column({ name: "midsem_start_time", type: "timestamptz" })
  midsemStartTime!: Date;

  @Column({ name: "midsem_end_time", type: "timestamptz" })
  midsemEndTime!: Date;

  @Column({ name: "compre_start_time", type: "timestamptz" })
  compreStartTime!: Date;

  @Column({ name: "compre_end_time", type: "timestamptz" })
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

export const namedCourseType = (name?: string) =>
  z.object({
    id: namedUUIDType(name),
    code: namedNonEmptyStringType(addNameToString("code", name)),
    name: namedNonEmptyStringType(addNameToString("name", name)),
    midsemStartTime: namedISOTimestampType(
      addNameToString("midsemStartTime", name)
    ),
    midsemEndTime: namedISOTimestampType(
      addNameToString("midsemEndTime", name)
    ),
    compreStartTime: namedISOTimestampType(
      addNameToString("compreStartTime", name)
    ),
    compreEndTime: namedISOTimestampType(
      addNameToString("compreEndTime", name)
    ),
    archived: namedBooleanType(addNameToString("archived", name)),
    acadYear: namedYearType(addNameToString("acadYear", name)),
    semester: namedSemesterType(name),
    createdAt: namedISOTimestampType(addNameToString("createdAt", name)),
  });

export const courseType = namedCourseType();
