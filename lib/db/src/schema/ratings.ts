import { integer, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { coursesTable } from "./courses";

export const ratingsTable = pgTable(
  "ratings",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    userId: varchar("user_id", { length: 128 })
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    courseId: varchar("course_id", { length: 128 })
      .references(() => coursesTable.id, { onDelete: "cascade" })
      .notNull(),
    rating: integer("rating").notNull(), // 1 to 5
    reviewText: text("review_text"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_course_rating_idx").on(table.userId, table.courseId),
  ]
);

export type RatingRecord = typeof ratingsTable.$inferSelect;
export type NewRatingRecord = typeof ratingsTable.$inferInsert;
