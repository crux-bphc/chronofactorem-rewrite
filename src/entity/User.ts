import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  Index,
} from "typeorm";
import { DegreeEnum, ApprovedDegreeList } from "../types/degrees";
import { Timetable } from "./Timetable";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ unique: true, type: "text" })
  email!: string;

  @Column({ type: "smallint" })
  batch!: number;

  @Column({ type: "text" })
  name!: string;

  @Column({
    type: "enum",
    array: true,
    enum: ApprovedDegreeList,
  })
  degrees!: DegreeEnum[];

  @OneToMany(() => Timetable, (timetable) => timetable.author)
  timetables: Timetable[];

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;
}
