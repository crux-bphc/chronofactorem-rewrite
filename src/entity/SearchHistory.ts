import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity()
export class SearchHistory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_email_hash", type: "text" })
  userEmailHash!: string;

  @Column({ name: "search_term", type: "text" })
  searchTerm!: string;

  @CreateDateColumn({
    name: "searched_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  searchedAt: Date;
}
