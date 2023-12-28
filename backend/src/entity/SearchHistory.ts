import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class SearchHistory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_email_hash", type: "varchar", length: 100 })
  userEmailHash!: string;

  @Column({ name: "search_term", type: "varchar", length: 200 })
  searchTerm!: string;

  @CreateDateColumn({
    name: "searched_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  searchedAt!: Date;
}
