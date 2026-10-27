import { index, integer, jsonb, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { contentBlocksTable } from "./contentBlocks";

export const quizQuestionsTable = pgTable(
  "quiz_questions",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    blockId: varchar("block_id", { length: 128 })
      .references(() => contentBlocksTable.id, { onDelete: "cascade" })
      .notNull(),
    prompt: text("prompt").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    answer: integer("answer").notNull(),
    sequenceOrder: integer("sequence_order").default(0).notNull(),
  },
  (table) => [
    index("quiz_questions_block_idx").on(table.blockId),
  ]
);

export type QuizQuestionRecord = typeof quizQuestionsTable.$inferSelect;
export type NewQuizQuestionRecord = typeof quizQuestionsTable.$inferInsert;
