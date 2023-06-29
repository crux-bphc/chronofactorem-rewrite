import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  UpdateDateColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { DegreeEnum, ApprovedDegreeList } from "../types/degrees";
import { User } from "./User";
import { Section } from "./Section";

@Entity()
export class Timetable {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Index()
  @ManyToOne(() => User, (author) => author.timetables)
  author!: User;

  @Column({ type: "varchar", length: 200 })
  name!: string;

  @Column({
    type: "enum",
    array: true,
    enum: ApprovedDegreeList,
  })
  degrees!: DegreeEnum[];

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

  @ManyToMany(() => Section, (section) => section.timetables)
  sections!: Section[];

  @Column({ type: "varchar", length: 3, array: true })
  timings!: string[];

  @Column({ name: "exam_start_times", type: "varchar", array: true })
  examStartTimes!: string[];

  @Column({ name: "exam_end_times", type: "varchar", array: true })
  examEndTimes!: string[];

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
