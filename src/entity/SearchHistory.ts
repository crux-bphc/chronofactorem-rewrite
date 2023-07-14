import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";
import {
  addNameToString,
  namedISOTimestampType,
  namedNonEmptyStringType,
  namedUUIDType,
} from "../types/zodFieldTypes";
import { z } from "zod";

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

export const namedSearchHistoryType = (name?: string) =>
  z.object({
    id: namedUUIDType(name),
    userEmailHash: namedNonEmptyStringType(
      addNameToString("user email hash", name)
    ),
    searchTerm: namedNonEmptyStringType(addNameToString("search term", name)),
    searchedAt: namedISOTimestampType(addNameToString("searchedAt", name)),
  });
