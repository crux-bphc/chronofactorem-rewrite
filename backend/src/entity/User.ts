import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { approvedDegreeList, degreeEnum } from "../types/degrees";
import { Timetable } from "./Timetable";

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
