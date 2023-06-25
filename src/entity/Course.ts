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

  @Column({ type: "varchar", length: 25 })
  name!: string;

  @Column({ name: "ic", type: "varchar", length: 100 })
  IC!: string;

  @OneToMany(() => Section, (section) => section.course)
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
  createdAt!: Date;
}
