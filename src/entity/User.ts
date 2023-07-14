import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  Index,
} from "typeorm";
import {
  DegreeEnum,
  ApprovedDegreeList,
  NamedDegreeZodList,
} from "../types/degrees";
import { Timetable } from "./Timetable";
import { z } from "zod";
import {
  addNameToString,
  namedEmailType,
  namedISOTimestampType,
  namedNonEmptyStringType,
  namedUUIDType,
  namedYearType,
} from "../types/zodFieldTypes";

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
    enum: ApprovedDegreeList,
  })
  degrees!: DegreeEnum[];

  @OneToMany(() => Timetable, (timetable) => timetable.author)
  timetables!: Timetable[];

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;
}

export const namedUserType = (name?: string) =>
  z.object({
    id: namedUUIDType(name),
    email: namedEmailType(name),
    batch: namedYearType(addNameToString("batch", name)),
    name: namedNonEmptyStringType(addNameToString("name", name)),
    degrees: NamedDegreeZodList(name),
    createdAt: namedISOTimestampType(addNameToString("createdAt", name)),
  });

export const userType = namedUserType();
