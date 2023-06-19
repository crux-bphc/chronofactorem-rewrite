import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from "typeorm";
import { Section } from "./Section";

@Entity()
export class Course {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ unique: true })
  code: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ name: "ic", type: "varchar" })
  IC: string;

  @ManyToOne(() => Section, (section) => section.course)
  sections!: Section[];

  @Column({ name: "midsem_time", type: "timestamptz" })
  midsemTime!: Date;

  @Column({ name: "compre_time", type: "timestamptz" })
  compreTime!: Date;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;
}
