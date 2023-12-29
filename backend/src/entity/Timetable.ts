import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { approvedDegreeList, degreeEnum } from "../../../lib";
import { Section } from "./Section";
import { User } from "./User";

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
