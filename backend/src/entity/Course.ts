import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
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
