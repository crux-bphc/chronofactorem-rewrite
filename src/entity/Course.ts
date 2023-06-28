import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  OneToMany,
} from "typeorm";
import { Section } from "./Section";

@Entity()
export class Course {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ unique: true })
  code!: string;

  @Column({ type: "varchar", length: 50 })
  name!: string;

  @OneToMany(() => Section, (section) => section.course)
  sections!: Section[];

  @Column({ name: "midsem_start_time", type: "timestamptz" })
  midsemStartTime!: Date;

  @Column({ name: "midsem_end_time", type: "timestamptz" })
  midsemEndTime!: Date;

  @Column({ name: "compre_time", type: "timestamptz" })
  compreTime!: Date;

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
