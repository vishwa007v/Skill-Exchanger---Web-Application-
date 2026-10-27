import { index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { coursesTable } from "./courses";

export const contentBlocksTable = pgTable(
  "content_blocks",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    courseId: varchar("course_id", { length: 128 })
      .references(() => coursesTable.id, { onDelete: "cascade" })
      .notNull(),
    type: varchar("type", { length: 50 }).notNull(), // 'video' | 'presentation' | 'quiz'
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").default("").notNull(),
    duration: integer("duration").default(0).notNull(), // in minutes
    source: text("source"),
    sequenceOrder: integer("sequence_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("content_blocks_course_order_idx").on(table.courseId, table.sequenceOrder),
  ]
);

export type ContentBlockRecord = typeof contentBlocksTable.$inferSelect;
export type NewContentBlockRecord = typeof contentBlocksTable.$inferInsert;
