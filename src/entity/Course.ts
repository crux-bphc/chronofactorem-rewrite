import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  OneToMany,
  Unique,
} from "typeorm";
import { Section } from "./Section";

@Entity()
@Unique(["name", "acadYear", "semester"])
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
